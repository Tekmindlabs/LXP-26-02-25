import { createContext, useContext } from 'react';
import type { Campus } from '@prisma/client';

interface CampusContextType {
  campus: Campus | null;
  setCampus: (campus: Campus | null) => void;
}

export const CampusContext = createContext<CampusContextType>({
  campus: null,
  setCampus: () => {},
});

export const useCampusContext = () => {
  const context = useContext(CampusContext);
  if (!context) {
    throw new Error('useCampusContext must be used within a CampusProvider');
  }
  return context;
};
