import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

interface RouterContextType {
  pathname: string;
  searchParams: URLSearchParams;
  push: (url: string) => void;
  replace: (url: string) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
}

const RouterContext = createContext<RouterContextType>({
  pathname: '/',
  searchParams: new URLSearchParams(),
  push: () => {},
  replace: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentUrl, setCurrentUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search + window.location.hash;
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentUrl(window.location.pathname + window.location.search + window.location.hash);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [pathname, searchParams] = useMemo(() => {
    try {
      const parsed = new URL(currentUrl, 'http://localhost');
      return [parsed.pathname, parsed.searchParams];
    } catch {
      const [path, query] = currentUrl.split('?');
      return [path || '/', new URLSearchParams(query || '')];
    }
  }, [currentUrl]);

  const push = (url: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', url);
      setCurrentUrl(url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const replace = (url: string) => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', url);
      setCurrentUrl(url);
    }
  };

  const back = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const forward = () => {
    if (typeof window !== 'undefined') {
      window.history.forward();
    }
  };

  const refresh = () => {
    setCurrentUrl(window.location.pathname + window.location.search + window.location.hash);
  };

  return (
    <RouterContext.Provider value={{ pathname, searchParams, push, replace, back, forward, refresh }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  return {
    push: ctx.push,
    replace: ctx.replace,
    back: ctx.back,
    forward: ctx.forward,
    refresh: ctx.refresh,
    prefetch: () => {},
  };
}

export function usePathname(): string {
  const ctx = useContext(RouterContext);
  return ctx.pathname;
}

export function useSearchParams(): URLSearchParams {
  const ctx = useContext(RouterContext);
  return ctx.searchParams;
}

export function redirect(url: string) {
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  replace?: boolean;
  scroll?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, replace = false, scroll = true, className, children, onClick, ...rest }, ref) => {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Allow standard command/ctrl clicks to open in new tab
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (rest.target && rest.target !== '_self')) {
        return;
      }
      e.preventDefault();
      onClick?.(e);
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
      if (scroll && typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    return (
      <a ref={ref} href={href} onClick={handleClick} className={className} {...rest}>
        {children}
      </a>
    );
  }
);

Link.displayName = 'Link';
