import { useState, useEffect, useCallback } from 'react';

// Custom event for internal navigation
const PUSH_STATE_EVENT = 'pushstate';

export const useRouter = () => {
  const [path, setPath] = useState(window.location.pathname);
  const [query, setQuery] = useState(new URLSearchParams(window.location.search));

  useEffect(() => {
    const sync = () => {
        setPath(window.location.pathname);
        setQuery(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', sync);
    window.addEventListener(PUSH_STATE_EVENT, sync);

    return () => {
        window.removeEventListener('popstate', sync);
        window.removeEventListener(PUSH_STATE_EVENT, sync);
    };
  }, []);

  const navigate = useCallback((url: string) => {
    try {
      window.history.pushState({}, '', url);
      // Dispatch custom event so other hook instances know to update
      window.dispatchEvent(new Event(PUSH_STATE_EVENT));
    } catch (e) {
      console.warn('History API restricted.', e);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { path, query, navigate };
};