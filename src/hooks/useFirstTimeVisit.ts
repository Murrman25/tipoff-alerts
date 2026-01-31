import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'lovable_first_visit_';

export function useFirstTimeVisit(featureKey: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${featureKey}`;
  
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(storageKey) !== 'visited';
  });

  const [showHelp, setShowHelp] = useState<boolean>(false);

  useEffect(() => {
    // On first visit, automatically enable help mode
    if (isFirstVisit) {
      setShowHelp(true);
    }
  }, [isFirstVisit]);

  const markAsVisited = useCallback(() => {
    localStorage.setItem(storageKey, 'visited');
    setIsFirstVisit(false);
  }, [storageKey]);

  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
    // Mark as visited when user toggles help off for the first time
    if (showHelp && isFirstVisit) {
      markAsVisited();
    }
  }, [showHelp, isFirstVisit, markAsVisited]);

  const resetFirstVisit = useCallback(() => {
    localStorage.removeItem(storageKey);
    setIsFirstVisit(true);
    setShowHelp(true);
  }, [storageKey]);

  return {
    isFirstVisit,
    showHelp,
    setShowHelp,
    toggleHelp,
    markAsVisited,
    resetFirstVisit,
  };
}
