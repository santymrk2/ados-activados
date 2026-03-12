import { BarChart3, Calendar, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { key: 'dashboard', Icon: BarChart3 },
  { key: 'activities', Icon: Calendar },
  { key: 'participants', Icon: Users },
];

export function BottomNav({ view, setView }) {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg shadow-black/10 border border-surface-dark flex z-50 px-3 py-2 pb-safe">
      {navItems.map(({ key, Icon }) => (
        <button
          key={key}
          onClick={() => setView(key)}
          className={cn(
            'relative p-2.5 rounded-xl transition-all duration-200',
            view === key
              ? 'text-primary bg-primary/10'
              : 'text-text-muted hover:text-dark'
          )}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </nav>
  );
}
