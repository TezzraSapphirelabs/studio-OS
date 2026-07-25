'use client';

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { GlassCard, Markdown, EmptyState } from '@/components';
import { PlusIcon, ZapIcon, EditIcon, TrashIcon, SearchIcon, MoreVerticalIcon } from '@/components/icons';
import { Button, Input } from '@/components/ui';
import {
  Message,
  Conversation,
  createConversation,
  getConversations,
  getMessages,
  addMessage,
  generateAIResponse,
  renameConversation,
  deleteConversation,
} from '@/services/ai';
import { formatRelativeDate } from '@/utils';

function ChatSendIcon({ size = 20, className }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function RefreshIcon({ size = 20, className }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-5.67"/>
    </svg>
  );
}

export default function AIWorkspacePage() {
  const { user } = useAuth();
  
  // States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [fetchingMsgs, setFetchingMsgs] = useState(false);
  const [optionsMenuId, setOptionsMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    async function load() {
      const data = await getConversations(user!.uid);
      setConversations(data);
      if (data.length > 0 && !activeConversationId) {
        setActiveConversationId(data[0].id!);
      }
    }
    load();
  }, [user, activeConversationId]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  // Load messages
  useEffect(() => {
    if (!user || !activeConversationId) return;
    async function loadMsgs() {
      setFetchingMsgs(true);
      setErrorMsg(null);
      try {
        const data = await getMessages(user!.uid, activeConversationId!);
        setMessages(data);
        scrollToBottom();
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(err.message);
        } else {
          console.error(err);
        }
      } finally {
        setFetchingMsgs(false);
      }
    }
    loadMsgs();
  }, [user, activeConversationId]);

  // Adjust textarea height automatically
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  const handleNewConversation = async () => {
    if (!user) return;
    const newId = await createConversation(user.uid, 'New Conversation');
    setActiveConversationId(newId);
    setMessages([]);
    const data = await getConversations(user.uid);
    setConversations(data);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !window.confirm('Are you sure you want to delete this conversation?')) return;
    
    await deleteConversation(user.uid, id);
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
    const data = await getConversations(user.uid);
    setConversations(data);
    setOptionsMenuId(null);
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameInput(currentTitle);
    setOptionsMenuId(null);
  };

  const handleRenameSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !renamingId || !renameInput.trim()) {
      setRenamingId(null);
      return;
    }
    
    await renameConversation(user.uid, renamingId, renameInput.trim());
    setRenamingId(null);
    const data = await getConversations(user.uid);
    setConversations(data);
  };

  const sendToAI = async (userText: string) => {
    if (!user || !activeConversationId) return;
    
    setLoading(true);
    setErrorMsg(null);
    try {
      const msgId = await addMessage(user.uid, activeConversationId, 'user', userText);
      // Temporarily add it to UI
      const tempUserMsg: Message = { id: msgId, role: 'user', content: userText, createdAt: new Date() };
      setMessages((prev) => [...prev, tempUserMsg]);
      scrollToBottom();
      
      const aiResponseText = await generateAIResponse(userText, messages);
      await addMessage(user.uid, activeConversationId, 'assistant', aiResponseText);
      
      const updatedMsgs = await getMessages(user.uid, activeConversationId);
      setMessages(updatedMsgs);
      scrollToBottom();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle pending AI prompt from Dashboard
  useEffect(() => {
    if (!user) return;
    const pendingPrompt = sessionStorage.getItem('pendingAiPrompt');
    if (pendingPrompt && conversations.length > 0 && activeConversationId && !fetchingMsgs && !loading) {
      sessionStorage.removeItem('pendingAiPrompt');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      sendToAI(pendingPrompt);
    } else if (pendingPrompt && conversations.length === 0 && !activeConversationId && !loading && !fetchingMsgs) {
       sessionStorage.removeItem('pendingAiPrompt');
       createConversation(user.uid, 'New Conversation').then(newId => {
         setActiveConversationId(newId);
         getConversations(user.uid).then(setConversations);
         sessionStorage.setItem('pendingAiPrompt', pendingPrompt);
       });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeConversationId, fetchingMsgs, loading, conversations.length]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !activeConversationId || loading) return;

    const userText = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    sendToAI(userText);
  };

  const handleRetry = async () => {
    // Find the last user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // Remove any trailing error
      setErrorMsg(null);
      setLoading(true);
      try {
        const history = [...messages].slice(0, messages.findIndex(m => m.id === lastUserMsg.id));
        const aiResponseText = await generateAIResponse(lastUserMsg.content, history);
        await addMessage(user!.uid, activeConversationId!, 'assistant', aiResponseText);
        const updatedMsgs = await getMessages(user!.uid, activeConversationId!);
        setMessages(updatedMsgs);
        scrollToBottom();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg('An error occurred.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = () => setOptionsMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-80px)] lg:h-[calc(100vh-64px)] gap-6 p-4 md:p-6 lg:p-8 animate-fade-in-up">
      {/* Sidebar for conversations */}
      <GlassCard className="hidden lg:flex w-80 flex-col overflow-hidden">
        <div className="flex flex-col border-b border-white/[0.04] p-4 gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Conversations</h2>
            <Button
              variant="icon"
              size="icon"
              onClick={handleNewConversation}
              title="New Chat"
            >
              <PlusIcon size={16} />
            </Button>
          </div>
          <div>
            <Input
              icon={<SearchIcon size={16} />}
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <p className="p-4 text-sm text-white/40 text-center">No conversations found.</p>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative flex items-center justify-between w-full p-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
                  activeConversationId === conv.id
                    ? 'glass-panel text-white/90'
                    : 'border-transparent text-white/50 hover:glass-panel hover:text-white/80 cursor-pointer'
                }`}
                onClick={() => {
                  if (renamingId !== conv.id) setActiveConversationId(conv.id!);
                }}
              >
                {renamingId === conv.id ? (
                  <form onSubmit={handleRenameSubmit} className="w-full">
                    <input
                      autoFocus
                      type="text"
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      onBlur={() => handleRenameSubmit()}
                      className="w-full bg-transparent outline-none text-white border-b border-white/20 pb-1"
                    />
                  </form>
                ) : (
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="truncate">{conv.title}</div>
                    <div className="text-xs text-white/30 font-normal mt-1">
                      {formatRelativeDate(conv.updatedAt?.toDate ? conv.updatedAt.toDate() : new Date())}
                    </div>
                  </div>
                )}
                
                {renamingId !== conv.id && (
                  <div className="relative shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOptionsMenuId(optionsMenuId === conv.id ? null : conv.id!);
                      }}
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 text-white/50 hover:text-white"
                    >
                      <MoreVerticalIcon size={14} />
                    </Button>
                    
                    {optionsMenuId === conv.id && (
                      <div className="absolute right-0 top-8 z-10 w-32 rounded-xl border border-white/10 bg-[#1a1a24] p-1 shadow-2xl">
                        <button
                          onClick={(e) => handleStartRename(conv.id!, conv.title, e)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white"
                        >
                          <EditIcon size={14} /> Rename
                        </button>
                        <button
                          onClick={(e) => handleDelete(conv.id!, e)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/[0.04]"
                        >
                          <TrashIcon size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Main Chat Area */}
      <GlassCard className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-white/[0.04] p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl glass-panel">
              <ZapIcon size={18} className="text-white/70" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/90">Studio OS Assistant</h2>
              <p className="text-xs text-white/40">Powered by Studio AI Engine</p>
            </div>
          </div>
          <div className="lg:hidden">
            <Button
              variant="icon"
              size="icon"
              onClick={handleNewConversation}
            >
              <PlusIcon size={16} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {fetchingMsgs ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white/80" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <EmptyState 
                icon={<ZapIcon size={36} />}
                title="How can I help you today?"
                description="I can help you organize tasks, manage your projects, or provide technical guidance."
              />
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full glass-panel text-white/90`}
                >
                  {msg.role === 'user' ? (
                    <span className="text-xs font-bold">{user.displayName?.charAt(0) || 'U'}</span>
                  ) : (
                    <ZapIcon size={14} />
                  )}
                </div>
                <div
                  className={`max-w-full md:max-w-[85%] rounded-2xl px-5 py-3 text-sm glass-panel text-white/90 ${
                    msg.role === 'user'
                      ? 'rounded-tr-none'
                      : 'rounded-tl-none'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Markdown content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full glass-panel text-white/90">
                <ZapIcon size={14} />
              </div>
              <div className="max-w-[75%] rounded-2xl px-5 py-4 text-sm glass-panel text-white/90 rounded-tl-none flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          {errorMsg && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-sm text-white/70 mb-2">{errorMsg}</div>
              <button 
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-xs"
              >
                <RefreshIcon size={14} /> Retry Message
              </button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-white/[0.04] p-4 lg:p-6 bg-[#0a0a0f]/50 backdrop-blur-xl">
          <form className="relative flex items-end bg-white/5 border border-white/10 rounded-2xl transition-all focus-within:border-white/20 focus-within:bg-white/[0.07] focus-within:ring-1 focus-within:ring-white/10">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={activeConversationId ? "Message Studio AI..." : "Create a conversation to start chatting"}
              disabled={loading || !activeConversationId}
              rows={1}
              className="w-full resize-none max-h-[200px] bg-transparent py-4 pl-5 pr-14 text-sm text-white placeholder-white/30 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              type="button"
              disabled={loading || !input.trim() || !activeConversationId}
              className="absolute right-2 bottom-2 flex h-10 w-10 items-center justify-center rounded-xl glass-panel text-white/90 hover:text-white transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChatSendIcon size={18} />
            </button>
          </form>
          <div className="mt-3 text-center text-xs text-white/20 flex items-center justify-between px-2">
            <span>AI can make mistakes. Consider verifying important information.</span>
            <span className="hidden md:inline">Press Enter to send, Shift + Enter for new line</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
