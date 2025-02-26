import { useState } from 'react';
import type { Campus } from '@prisma/client';
import { CampusContext } from '@/hooks/useCampusContext';

export const CampusProvider = ({ children }: { children: React.ReactNode }) => {
  const [campus, setCampus] = useState<Campus | null>(null);

  return (
    <CampusContext.Provider value={{ campus, setCampus }}>
      {children}
    </CampusContext.Provider>
  );
};
