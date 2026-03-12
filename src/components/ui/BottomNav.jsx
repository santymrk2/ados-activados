import { useState, useEffect } from 'react';
import { BarChart3, Calendar, Users } from 'lucide-react';
import { navigate } from 'astro:transitions/client';

const NAV_ITEMS = [
  { path: '/', Icon: BarChart3, label: 'Dashboard' },
  { path: '/activities', Icon: Calendar, label: 'Actividades' },
  { path: '/participants', Icon: Users, label: 'Jugadores' },
];

export function BottomNav() {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleNavigation);
    document.addEventListener('astro:after-transition', handleNavigation);
    document.addEventListener('astro:after-swap', handleNavigation);
    
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      document.removeEventListener('astro:after-transition', handleNavigation);
      document.removeEventListener('astro:after-swap', handleNavigation);
    };
  }, []);

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg shadow-black/10 border border-surface-dark flex z-50 px-3 py-2 pb-safe">
      {NAV_ITEMS.map(({ path, Icon, label }) => {
        const isActive = currentPath === path || (path !== '/' && currentPath.startsWith(path));
        return (
          <a
            key={path}
            href={path}
            className={`relative p-2.5 rounded-xl transition-all duration-200 ${
              isActive ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-dark'
            }`}
            title={label}
          >
            <Icon className="w-5 h-5" />
          </a>
        );
      })}
    </nav>
  );
}
