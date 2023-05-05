import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll the window up on every navigation
 * @see https://reactrouter.com/web/guides/scroll-restoration
 */
export function RouterScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
