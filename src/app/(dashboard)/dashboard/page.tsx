"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { BlurText } from "@/components/ui/blur-text";
import { 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  Sparkles, 
  ArrowUpRight,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/glass-card";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/contexts/auth-context";
import { subscribeToProjects } from "@/services/projects";
import { useAllProjectsTasks } from "@/hooks/use-tasks";
import type { Project, Task } from "@/types";
import { formatRelativeDate, getCompletionPercent } from "@/utils";

const FADE_UP = {
  hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: "easeOut" as const } }
};

const STAGGER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Use the hook instead of direct subscription to avoid Firestore permission error
  const { tasks } = useAllProjectsTasks(user?.uid, projects);
  
  const [aiPrompt, setAiPrompt] = useState("");
  const [timeOfDay] = useState(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17) return "evening";
    return "morning";
  });

  useEffect(() => {
    if (!user) return;
    const unsubProjects = subscribeToProjects(user.uid, (data) => setProjects(data), (error) => console.error(error));
    return () => {
      unsubProjects();
    };
  }, [user]);

  const activeProjects = useMemo(() => projects.filter(p => p.status !== 'archived'), [projects]);
  const tasksDue = useMemo(() => tasks.filter(t => t.status !== 'done'), [tasks]);
  
  // Sort projects by updatedAt desc for "Recent"
  const recentProjects = useMemo(() => {
    return [...activeProjects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  }, [activeProjects]);

  // Today's tasks (or just the most recent/due tasks, since we may not have actual "due today" check easily, let's take incomplete tasks sorted by created or due date)
  const todaysTasks = useMemo(() => {
    return tasks.filter(t => t.status !== 'done').slice(0, 5);
  }, [tasks]);

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    sessionStorage.setItem('pendingAiPrompt', aiPrompt.trim());
    router.push('/ai');
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={STAGGER}
      className="p-6 lg:p-10 space-y-10 pb-24"
    >
      {/* Welcome Header */}
      <motion.section variants={FADE_UP} className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white">
          <BlurText text={`Good ${timeOfDay}, ${user?.displayName?.split(' ')[0] || 'User'}.`} delay={0} animateBy="words" />
        </h1>
        <p className="text-white/50 text-lg">
          You have {tasksDue.length} {tasksDue.length === 1 ? 'task' : 'tasks'} due.
        </p>
      </motion.section>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/projects" className="block outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-[24px]">
          <StatCard
            variants={FADE_UP}
            label="Active Projects"
            value={activeProjects.length.toString()}
            icon={<FolderKanban className="w-5 h-5 text-white" />}
            trend={`${projects.length} total`}
            trendUp={true}
            accentColor="rgba(255,255,255,0.1)"
          />
        </Link>
        <Link href="/tasks" className="block outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-[24px]">
          <StatCard
            variants={FADE_UP}
            label="Tasks Due"
            value={tasksDue.length.toString()}
            icon={<CheckSquare className="w-5 h-5 text-white" />}
            trend={`${tasks.filter(t => t.status === 'done').length} completed`}
            trendUp={true}
            accentColor="rgba(255,255,255,0.1)"
          />
        </Link>
        <Link href="/analytics" className="block outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-[24px]">
          <StatCard
            variants={FADE_UP}
            label="Hours Tracked"
            value="38.5"
            icon={<Clock className="w-5 h-5 text-white" />}
            trend="This week"
            trendUp={true}
            accentColor="rgba(255,255,255,0.1)"
          />
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column (Projects & Activity) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Recent Projects */}
          <div className="space-y-4">
            <motion.div variants={FADE_UP} className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Recent Projects</h2>
              <Link href="/projects" className="text-sm text-white/50 hover:text-white flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.length === 0 ? (
                <div className="col-span-full py-8 text-center text-sm text-white/40">No active projects found.</div>
              ) : recentProjects.map((project) => {
                const progress = getCompletionPercent(project.completedTaskCount || 0, project.taskCount || 0);
                return (
                  <Link key={project.id} href={`/projects/${project.id}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-3xl group">
                    <GlassCard variants={FADE_UP} hover padding="none" className="p-5 flex flex-col gap-4 h-full group-hover:bg-white/[0.04] transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center">
                          <FolderKanban className="w-5 h-5 text-white/70" />
                        </div>
                        <button className="text-white/30 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1 truncate">{project.name}</h3>
                        <p className="text-white/40 text-xs truncate">Updated {formatRelativeDate(project.updatedAt)}</p>
                      </div>
                      <div className="space-y-2 mt-auto pt-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/50">{project.status === 'active' ? 'In Progress' : project.status}</span>
                          <span className="text-white/70">{progress}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="h-full bg-white/40 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* AI Workspace Preview */}
          <motion.section variants={FADE_UP} className="glass-panel p-8 rounded-[24px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 max-w-lg space-y-4">
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest font-mono">Intelligence</span>
              </div>
              <h2 className="text-2xl font-light text-white">Ask Studio AI</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Analyze project progress, generate reports, or ask for insights across your workspace.
              </p>
              <form onSubmit={handleAiSubmit} className="mt-6 flex">
                <div className="relative w-full max-w-md group-focus-within:ring-1 ring-white/20 rounded-xl transition-all">
                  <input 
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g. Summarize the latest updates on Nebula..."
                    className="w-full h-12 bg-white/[0.03] border border-white/[0.06] rounded-xl pl-4 pr-12 text-white text-[14px] placeholder:text-white/20 transition-all duration-300 outline-none focus:border-white/20 focus:bg-white/[0.05] hover:bg-white/[0.04]"
                  />
                  <button type="submit" disabled={!aiPrompt.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </motion.section>
        </div>

        {/* Right Column (Tasks & Calendar) */}
        <div className="space-y-8">
          
          {/* Today's Tasks */}
          <div className="space-y-4">
            <motion.div variants={FADE_UP} className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Today&apos;s Tasks</h2>
              <Link href="/tasks" className="text-sm text-white/50 hover:text-white flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <GlassCard variants={FADE_UP} padding="none" className="p-1">
              <div className="space-y-1">
                {todaysTasks.length === 0 ? (
                  <div className="p-8 text-center text-sm text-white/40">You have no tasks due.</div>
                ) : todaysTasks.map((task) => {
                  const projectName = projects.find(p => p.id === task.projectId)?.name || 'Unknown Project';
                  return (
                    <Link key={task.id} href={`/projects/${task.projectId}/tasks`} className="block outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-xl">
                      <div className="p-4 rounded-xl hover:bg-white/[0.04] transition-colors flex gap-4 group cursor-pointer">
                        <div className="pt-0.5">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-white text-black border-white' : 'border-white/20 group-hover:border-white/40'}`}>
                            {task.status === 'done' && <CheckSquare className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'text-white/30 line-through' : 'text-white/90'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                            <span className="truncate">{projectName}</span>
                            <span>•</span>
                            <span className="whitespace-nowrap capitalize">{task.priority} Priority</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
