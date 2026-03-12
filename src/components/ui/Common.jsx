import { ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto pb-5">
      <div className="bg-surface-dark p-4 border-b border-surface-dark flex items-center gap-3 sticky top-0">
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-xl bg-surface-dark border border-surface-dark text-dark text-lg cursor-pointer flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="font-black text-lg">{title}</div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function PageHeader({ title, sub }) {
  return (
    <div className="bg-primary text-white p-4 pb-3">
      <div className="text-2xl font-black tracking-tight" style={{ fontFamily: 'ClashGrotesk, sans-serif' }}>
        ACTIVADOS
      </div>
      <div className="flex justify-between items-end mt-1">
        <h2 className="text-lg font-bold opacity-80">{title}</h2>
        {sub && <div className="text-sm opacity-60">{sub}</div>}
      </div>
    </div>
  );
}

export function Section({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="w-5 h-5 text-primary" />}
      <div className="font-bold text-base">{title}</div>
    </div>
  );
}

export function Label({ children, style }) {
  return (
    <div className="text-xs text-text-muted font-bold uppercase tracking-wide mb-2" style={style}>
      {children}
    </div>
  );
}

export function Empty({ text }) {
  return <div className="text-center py-8 text-text-muted text-sm">{text}</div>;
}

export function InfoCard({ text }) {
  return (
    <div className="bg-surface-dark rounded-lg p-3 text-sm text-text-muted border border-surface-dark leading-relaxed">
      {text}
    </div>
  );
}

export function SegmentedButtons({ options, value, onChange }) {
  return (
    <div className="flex gap-2 mb-3">
      {options.map(({ val, label, color }) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className="flex-1 py-3 rounded-lg border-none cursor-pointer font-bold text-sm"
          style={{
            backgroundColor: value === val ? (color || '#4342FF') : '#e5e5e5',
            color: value === val ? (color ? 'black' : 'white') : '#666',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function PillCheck({ label, icon: Icon, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded-lg cursor-pointer text-sm flex items-center gap-1"
      style={{
        border: `1px solid ${active ? color + '66' : '#e5e5e5'}`,
        backgroundColor: active ? color + '33' : '#f5f5f5',
        color: active ? color : '#999',
      }}
    >
      {Icon ? <Icon className="w-3.5 h-3.5" /> : label}
    </button>
  );
}
