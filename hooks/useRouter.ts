import { useState, useEffect } from 'react';

export const useRouter = () => {
  const [path, setPath] = useState(window.location.pathname);
  const [query, setQuery] = useState(new URLSearchParams(window.location.search));

  useEffect(() => {
    const onPopState = () => {
        setPath(window.location.pathname);
        setQuery(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (url: string) => {
    try {
      window.history.pushState({}, '', url);
    } catch (e) {
      console.warn('History API restricted, falling back to state only navigation.', e);
    }
    
    // Extract just the pathname for internal routing logic
    const urlObj = new URL(url, window.location.origin);
    setPath(urlObj.pathname);
    setQuery(urlObj.searchParams);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { path, query, navigate };
};