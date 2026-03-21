import { X } from 'lucide-react';
import { Avatar } from './Avatar';
import { getEdad } from '../../lib/constants';

export function PlayerInfoModal({ player, onClose }) {
  if (!player) return null;
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4 transition-opacity" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl transform transition-all relative flex flex-col items-center animate-in fade-in zoom-in duration-200" 
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-surface-dark text-text-muted hover:bg-black/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="mb-4 mt-2">
          <Avatar p={player} size={96} />
        </div>
        
        <h3 className="font-black text-2xl text-center leading-tight text-dark mb-1">
          {player.nombre} <br /> {player.apellido}
        </h3>
        
        <div className="mt-3 text-sm font-black text-text-muted bg-surface-dark px-4 py-1.5 rounded-full uppercase tracking-wider">
          {getEdad(player.fechaNacimiento)} años
        </div>
      </div>
    </div>
  );
}
