'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SearchModal } from '@/components/search/search-modal';

interface SearchContextValue {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SearchContext.Provider value={{ isOpen, openSearch: () => setIsOpen(true), closeSearch: () => setIsOpen(false) }}>
      {children}
      {isOpen && <SearchModal onClose={() => setIsOpen(false)} />}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
