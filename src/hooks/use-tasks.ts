import { useState, useEffect } from 'react';
import { subscribeToProjectTasks } from '@/services/tasks';
import type { Task, Project } from '@/types';

export function useAllProjectsTasks(uid: string | undefined, projects: Project[]) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || projects.length === 0) {
      Promise.resolve().then(() => {
        setTasks([]);
        setLoading(false);
      });
      return;
    }

    Promise.resolve().then(() => setLoading(true));
    const tasksByProject = new Map<string, Task[]>();
    const unsubscribes: (() => void)[] = [];

    let loadedCount = 0;

    const checkLoading = () => {
      if (loadedCount >= projects.length) {
        setLoading(false);
      }
    };

    projects.forEach((project) => {
      let isFirstLoad = true;
      const unsub = subscribeToProjectTasks(uid, project.id, (projectTasks, err) => {
        if (err) {
          console.error(`Error loading tasks for project ${project.id}:`, err);
          setError(err);
        } else {
          tasksByProject.set(project.id, projectTasks);
          const allTasks = Array.from(tasksByProject.values()).flat();
          allTasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setTasks(allTasks);
        }

        if (isFirstLoad) {
          isFirstLoad = false;
          loadedCount++;
          checkLoading();
        }
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [uid, projects]); 

  return { tasks, loading, error };
}
