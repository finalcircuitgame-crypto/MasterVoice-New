import { useState, useEffect } from 'react';

export const useRouter = () => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (newPath: string) => {
    try {
      window.history.pushState({}, '', newPath);
    } catch (e) {
      // In some sandboxed environments, pushState might fail. 
      // We catch it so the React state update still happens.
      console.warn('History API restricted, falling back to state only navigation.', e);
    }
    setPath(newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { path, navigate };
};