import { BarChart3, Settings, LogOut, X } from 'lucide-react';

export function Loader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <BarChart3 className="w-16 h-16 text-primary mx-auto mb-3" />
        <div className="text-primary font-bold">Cargando...</div>
      </div>
    </div>
  );
}

export function SettingsPanel({ isOpen, onClose, onLogout }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-surface-dark">
          <div className="flex items-center justify-between">
            <div className="font-black text-lg">Configuración</div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-surface-dark flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <button
            onClick={onLogout}
            className="w-full py-3 px-4 bg-red-50 rounded-xl flex items-center gap-3 text-red-600 font-bold"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
        <div className="p-4 pb-8">
          <div className="text-center text-xs text-text-muted">
            Sesión activa por 24 horas
          </div>
        </div>
      </div>
    </div>
  );
}
