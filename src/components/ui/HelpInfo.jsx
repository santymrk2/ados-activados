import { useState } from 'react';
import { Info, X } from 'lucide-react';

export function HelpInfo({ title, text }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  
  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="w-6 h-6 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="font-black text-sm text-primary flex items-center gap-2 uppercase tracking-wider">
                <Info className="w-4 h-4" />
                {title || 'Información'}
              </div>
              <button onClick={() => setOpen(false)} className="w-11 h-11 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-text-muted leading-relaxed font-medium">
              {text}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-full mt-6 py-3 bg-primary text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
