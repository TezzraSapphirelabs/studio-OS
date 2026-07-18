'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-invert prose-sm md:prose-base max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code(props: any) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !match;

            if (isInline) {
              return (
                <code className="bg-white/10 px-1.5 py-0.5 rounded text-[0.9em] text-white" {...rest}>
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={language} value={String(children).replace(/\n$/, '')} />
            );
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          a(props: any) {
            return <a target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline" {...props} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden my-4 border border-white/[0.08] bg-[#0a0a0f]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/[0.04]">
        <span className="text-xs text-white/50 font-mono lowercase">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm">
        <SyntaxHighlighter
          style={atomDark}
          language={language}
          PreTag="div"
          customStyle={{ margin: 0, padding: 0, background: 'transparent' }}
          wrapLines={true}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
