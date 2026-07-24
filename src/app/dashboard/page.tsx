"use client";

import React from "react";
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

const STATS = [
  { label: "Active Projects", value: "12", icon: FolderKanban, trend: "+2 this week" },
  { label: "Tasks Due", value: "24", icon: CheckSquare, trend: "4 high priority" },
  { label: "Hours Tracked", value: "38.5", icon: Clock, trend: "This week" },
];

const RECENT_PROJECTS = [
  { name: "Nebula Redesign", status: "In Progress", progress: 75, date: "Updated 2h ago" },
  { name: "Q3 Marketing Site", status: "Review", progress: 90, date: "Updated 5h ago" },
  { name: "iOS App v2.0", status: "Planning", progress: 15, date: "Updated 1d ago" },
];

const TASKS = [
  { title: "Review final mockups for Nebula", project: "Nebula Redesign", time: "10:00 AM", done: false },
  { title: "Client sync on Q3 deliverables", project: "Q3 Marketing Site", time: "1:30 PM", done: false },
  { title: "Update component library", project: "Internal", time: "4:00 PM", done: true },
];

export default function DashboardPage() {
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
          <BlurText text="Good morning, User." delay={0} animateBy="words" />
        </h1>
        <p className="text-white/50 text-lg">
          You have 4 high priority tasks due today.
        </p>
      </motion.section>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATS.map((stat, i) => (
          <StatCard
            key={i}
            variants={FADE_UP}
            label={stat.label}
            value={stat.value}
            icon={<stat.icon className="w-5 h-5 text-white" />}
            trend={stat.trend}
            trendUp={true}
            accentColor="rgba(255,255,255,0.1)"
          />
        ))}
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
              {RECENT_PROJECTS.map((project, i) => (
                <GlassCard key={i} variants={FADE_UP} hover padding="none" className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center">
                      <FolderKanban className="w-5 h-5 text-white/70" />
                    </div>
                    <button className="text-white/30 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">{project.name}</h3>
                    <p className="text-white/40 text-xs">{project.date}</p>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">{project.status}</span>
                      <span className="text-white/70">{project.progress}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full bg-white/40 rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </GlassCard>
              ))}
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
              <div className="mt-6 flex">
                <div className="relative w-full max-w-md group-focus-within:ring-1 ring-white/20 rounded-xl transition-all">
                  <input 
                    type="text" 
                    placeholder="E.g. Summarize the latest updates on Nebula..."
                    className="w-full h-12 bg-white/[0.03] border border-white/[0.06] rounded-xl pl-4 pr-12 text-white text-[14px] placeholder:text-white/20 transition-all duration-300 outline-none focus:border-white/20 focus:bg-white/[0.05] hover:bg-white/[0.04]"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
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
                {TASKS.map((task, i) => (
                  <div key={i} className="p-4 rounded-xl hover:bg-white/[0.04] transition-colors flex gap-4 group cursor-pointer">
                    <div className="pt-0.5">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${task.done ? 'bg-white text-black border-white' : 'border-white/20 group-hover:border-white/40'}`}>
                        {task.done && <CheckSquare className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${task.done ? 'text-white/30 line-through' : 'text-white/90'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                        <span>{task.project}</span>
                        <span>•</span>
                        <span>{task.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
