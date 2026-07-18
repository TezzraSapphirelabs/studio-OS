'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { type Project, type ProjectRole } from '@/types';
import { FolderIcon, CheckSquareIcon, SettingsIcon, UsersIcon } from '@/components/icons';

interface ProjectContextType {
  project: Project | null;
  userRole: ProjectRole | null;
  loading: boolean;
  error: string | null;
}

const ProjectContext = createContext<ProjectContextType>({
  project: null,
  userRole: null,
  loading: true,
  error: null,
});

export function useProject() {
  return useContext(ProjectContext);
}

// Simple ActivityIcon
function ActivityIcon2({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

const TABS = [
  { label: 'Overview', href: '', icon: FolderIcon },
  { label: 'Tasks', href: '/tasks', icon: CheckSquareIcon },
  { label: 'Members', href: '/members', icon: UsersIcon },
  { label: 'Activity', href: '/activity', icon: ActivityIcon2 },
  { label: 'Settings', href: '/settings', icon: SettingsIcon },
];

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);
  const { user } = useAuth();
  const pathname = usePathname();
  const [project, setProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const ref = doc(db, 'projects', projectId);
    
    const unsubscribe = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        setError('Project not found or access denied.');
        setLoading(false);
        return;
      }
      
      const data = snap.data();
      const rawMemberUids = data.memberUids || [];
      const memberUids: string[] = Array.from(new Set([...rawMemberUids, data.ownerUid || ''])).filter(Boolean);
      
      const isOwner = data.ownerUid === user.uid;
      const isMember = memberUids.includes(user.uid);

      if (!isOwner && !isMember) {
        setError('Project not found or access denied.');
        setLoading(false);
        return;
      }
      
      let fetchedRole: ProjectRole = 'viewer';
      if (isOwner) {
        fetchedRole = 'owner';
      } else {
        try {
          const memberSnap = await getDoc(doc(db, 'members', `${projectId}_${user.uid}`));
          if (memberSnap.exists()) {
            fetchedRole = memberSnap.data().role as ProjectRole;
          }
        } catch {
          // Fallback to viewer if read fails
        }
      }
      setUserRole(fetchedRole);

      setProject({
        id: snap.id,
        ownerUid: data.ownerUid ?? '',
        memberUids,
        name: data.name ?? '',
        description: data.description ?? '',
        status: data.status ?? 'active',
        color: data.color ?? '#8b5cf6',
        icon: data.icon ?? undefined,
        memberCount: data.memberCount ?? 0,
        taskCount: data.taskCount ?? 0,
        completedTaskCount: data.completedTaskCount ?? 0,
        createdAt: data.createdAt ?? new Date().toISOString(),
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      });
      setLoading(false);
      setError(null);
    }, (e) => {
      console.error(e);
      setError('Failed to load project.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, projectId]);

  const basePath = `/projects/${projectId}`;

  return (
    <ProjectContext.Provider value={{ project, userRole, loading, error }}>
      <div className="space-y-6">
        {/* Header & Tabs */}
        {loading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-white/[0.02]" />
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-6 text-red-400">
            {error}
          </div>
        ) : project ? (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
                style={{ backgroundColor: `${project.color}20`, color: project.color }}
              >
                <FolderIcon size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {project.name}
                </h1>
                <p className="mt-1 text-sm text-white/40">{project.description}</p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-white/[0.04] pb-px scrollbar-hide">
              {TABS.map((tab) => {
                const fullHref = `${basePath}${tab.href}`;
                const isActive = pathname === fullHref || (tab.href !== '' && pathname.startsWith(fullHref));
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.label}
                    href={fullHref}
                    className={`group flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-violet-500 text-violet-300'
                        : 'border-transparent text-white/40 hover:text-white/70'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-violet-400' : 'text-white/30 group-hover:text-white/50'} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Tab Content */}
        {(!loading && !error && project) && children}
      </div>
    </ProjectContext.Provider>
  );
}
