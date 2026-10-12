import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const setLoading = useCallback((loading: boolean) => {
    setLoadingCount(prev => {
      const next = loading ? prev + 1 : Math.max(0, prev - 1);
      setIsLoading(next > 0);
      return next;
    });
  }, []);

  const withLoading = useCallback(async <T,>(promise: Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      return await promise;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, withLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
