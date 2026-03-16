import { cn } from '../../lib/utils';

const PODIUM_COLORS = [
  { bg: '#F59E0B', text: '#fff', shadow: '#F59E0B44' },
  { bg: '#94A3B8', text: '#fff', shadow: '#94A3B844' },
  { bg: '#B45309', text: '#fff', shadow: '#B4530944' },
];

export function RankBadge({ pos }) {
  if (pos <= 3) {
    const c = PODIUM_COLORS[pos - 1];
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm z-0 flex-shrink-0"
        style={{ backgroundColor: c.bg, color: c.text, boxShadow: `0 0 0 3px ${c.shadow}` }}
      >
        {pos}
      </div>
    );
  }
  return (
    <div className="w-8 h-8 flex items-center justify-center font-light text-sm text-text-muted z-0 flex-shrink-0">
      {pos}
    </div>
  );
}

export function SexBadge({ sex, className = '' }) {
  const isM = sex === 'M';
  const isF = sex === 'F';
  const isMX = sex === 'MX';
  
  return (
    <span
      className={cn(
        "inline-block rounded-full",
        isM ? 'bg-cyan-500' : 
        isMX ? 'bg-indigo-500' : 
        'bg-pink-500',
        className
      )}
      style={{ width: '8px', height: '8px', minWidth: '8px' }}
    />
  );
}

export function Chip({ icon: Icon, val, label }) {
  return (
    <div className="bg-surface-dark rounded-lg px-2 py-1 text-xs font-bold text-text-muted flex items-center gap-1">
      {Icon && <Icon className="w-3 h-3" />}
      {val} <span className="opacity-50">{label}</span>
    </div>
  );
}
