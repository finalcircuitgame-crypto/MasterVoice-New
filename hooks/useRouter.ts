import { useState, useEffect } from 'react';

export const useRouter = () => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (url: string) => {
    try {
      window.history.pushState({}, '', url);
    } catch (e) {
      console.warn('History API restricted, falling back to state only navigation.', e);
    }
    
    // Extract just the pathname for internal routing logic (ignore query params)
    const urlObj = new URL(url, window.location.origin);
    setPath(urlObj.pathname);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { path, navigate };
};