'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { BlurText } from '@/components/ui/blur-text';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { ArrowRight, Box, Layers, Zap } from 'lucide-react';

const FADE_UP = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: "easeOut" as const } }
};

const STAGGER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

export default function WelcomePage() {
  return (
    <AuroraBackground className="text-white font-sans selection:bg-white selection:text-black overflow-y-auto overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          <span className="text-[12px] font-semibold tracking-widest uppercase text-white/80">Studio OS</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[13px] font-medium text-white/60 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <ShimmerButton className="h-9 px-6 text-[12px]">
              Get Started
            </ShimmerButton>
          </Link>
        </div>
      </nav>

      {/* Main Scroll Container */}
      <div className="relative z-10 w-full h-full snap-y snap-mandatory overflow-y-auto">
        
        {/* Hero Section */}
        <section className="min-h-screen w-full flex flex-col items-center justify-center px-4 pt-20 snap-center relative">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-20%" }}
            variants={STAGGER}
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            <motion.div variants={FADE_UP} className="inline-flex items-center justify-center mb-4">
              <AnimatedShinyText className="text-[12px] md:text-[13px] font-mono tracking-widest uppercase py-1 px-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                Intelligence Awaits
              </AnimatedShinyText>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tighter text-white">
              <BlurText text="Studio OS" delay={0.2} animateBy="letters" />
            </h1>
            
            <motion.p variants={FADE_UP} className="text-lg md:text-xl text-white/50 font-medium max-w-2xl mx-auto leading-relaxed">
              A professional operating system for creators, businesses, and AI collaboration. 
              Designed from first principles to be calm, intelligent, and extraordinarily capable.
            </motion.p>
            
            <motion.div variants={FADE_UP} className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/register">
                <ShimmerButton className="h-14 px-10 text-[15px]">
                  Initialize Workspace <ArrowRight className="w-4 h-4 ml-2" />
                </ShimmerButton>
              </Link>
              <Link href="/login" className="text-[14px] font-medium text-white/60 hover:text-white transition-colors underline-offset-4 hover:underline">
                Sign in to existing account
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-50"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] font-mono">Scroll</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
          </motion.div>
        </section>

        {/* Why Studio OS Section */}
        <section className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-32 snap-center">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-20%" }}
            variants={STAGGER}
            className="max-w-6xl w-full mx-auto"
          >
            <motion.div variants={FADE_UP} className="text-center mb-24">
              <h2 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-6">
                <BlurText text="Why Studio OS?" delay={0.1} />
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                Built for those who demand excellence. We stripped away the noise to give you a pure, uninterrupted environment for your best work.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Box className="w-6 h-6 text-white/70" />,
                  title: "Spatial Architecture",
                  desc: "An interface that respects your screen space, utilizing depth and motion to organize complex information."
                },
                {
                  icon: <Zap className="w-6 h-6 text-white/70" />,
                  title: "Instant Performance",
                  desc: "GPU-accelerated rendering and optimistic UI updates make every interaction feel immediate and effortless."
                },
                {
                  icon: <Layers className="w-6 h-6 text-white/70" />,
                  title: "AI Native",
                  desc: "Intelligence isn't an afterthought. It's woven deeply into the fabric of the operating system."
                }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  variants={FADE_UP}
                  className="p-8 rounded-[24px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-medium text-white mb-3">{feature.title}</h3>
                  <p className="text-white/50 leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* What You Can Do Section */}
        <section className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-32 snap-center">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-20%" }}
            variants={STAGGER}
            className="max-w-6xl w-full mx-auto"
          >
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <motion.div variants={FADE_UP} className="lg:w-1/2 space-y-8">
                <h2 className="text-3xl md:text-5xl font-light tracking-tight text-white leading-tight">
                  <BlurText text="Everything you need." delay={0.1} />
                  <br />
                  <span className="text-white/30">Nothing you don&apos;t.</span>
                </h2>
                <div className="space-y-6">
                  {[
                    "Manage sophisticated projects and teams with absolute clarity.",
                    "Collaborate with built-in AI that understands your context.",
                    "Organize your knowledge base securely and beautifully.",
                    "Analyze performance with real-time, privacy-first telemetry."
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 shrink-0" />
                      <p className="text-white/60 text-lg">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div variants={FADE_UP} className="lg:w-1/2 w-full">
                <div className="aspect-square md:aspect-[4/3] rounded-[32px] bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.1] backdrop-blur-3xl p-2 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-transparent transition-colors duration-700" />
                  <div className="w-full h-full rounded-[24px] bg-[#050505]/80 border border-white/[0.05] flex items-center justify-center p-8 relative overflow-hidden">
                     {/* Decorative UI elements mimicking the OS */}
                     <div className="absolute top-8 left-8 right-8 flex justify-between items-center opacity-30">
                       <div className="w-24 h-2 rounded bg-white/20" />
                       <div className="flex gap-2">
                         <div className="w-8 h-8 rounded-full bg-white/10" />
                         <div className="w-8 h-8 rounded-full bg-white/10" />
                       </div>
                     </div>
                     <div className="w-full space-y-4 opacity-40">
                       <div className="w-3/4 h-12 rounded-xl bg-white/5 border border-white/10" />
                       <div className="w-full h-24 rounded-xl bg-white/5 border border-white/10" />
                       <div className="w-1/2 h-12 rounded-xl bg-white/5 border border-white/10" />
                     </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Final CTA Section */}
        <section className="min-h-[70vh] w-full flex flex-col items-center justify-center px-4 snap-center pb-20">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-20%" }}
            variants={STAGGER}
            className="text-center max-w-3xl mx-auto space-y-10"
          >
            <motion.h2 variants={FADE_UP} className="text-4xl md:text-6xl font-light tracking-tight text-white">
              Ready to begin?
            </motion.h2>
            <motion.p variants={FADE_UP} className="text-white/50 text-xl font-medium">
              Join the professionals who have already upgraded their workspace.
            </motion.p>
            <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Link href="/register">
                <ShimmerButton className="h-14 px-12 text-[15px]">
                  Get Started Now
                </ShimmerButton>
              </Link>
              <Link href="/login" className="text-[14px] font-medium text-white/60 hover:text-white transition-colors underline-offset-4 hover:underline">
                Sign in to your workspace
              </Link>
            </motion.div>
          </motion.div>
        </section>
        
        {/* Minimal Footer */}
        <footer className="w-full py-8 border-t border-white/[0.05] text-center snap-end">
          <p className="text-[11px] font-mono text-white/30 uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} Studio OS. All rights reserved.
          </p>
        </footer>

      </div>
    </AuroraBackground>
  );
}
