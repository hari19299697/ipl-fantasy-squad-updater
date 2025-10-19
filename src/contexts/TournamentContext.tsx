import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TournamentContextType {
  selectedTournamentId: string | null;
  setSelectedTournamentId: (id: string | null) => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedTournamentId';

export const TournamentProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTournamentId, setSelectedTournamentIdState] = useState<string | null>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || null;
  });

  const setSelectedTournamentId = (id: string | null) => {
    setSelectedTournamentIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <TournamentContext.Provider value={{ selectedTournamentId, setSelectedTournamentId }}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournamentContext = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournamentContext must be used within a TournamentProvider');
  }
  return context;
};
