import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { getTodayDateString } from '../../lib/utils';

export function NewActivityModal({ onClose }) {
  const { saveActivity, db } = useApp();
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState(getTodayDateString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const emptyActivity = {
      titulo: titulo.trim() || 'Sin título',
      fecha,
      asistentes: [],
      equipos: {},
      juegos: [],
      puntuales: [],
      biblias: [],
      partidos: [],
      goles: [],
    };
    await saveActivity(emptyActivity, true);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up">
        <h2 className="font-black text-xl mb-4">Nueva Actividad</h2>

        <div className="mb-4">
          <label className="block text-sm font-bold text-text-muted mb-2">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: 3ero de Mayo, Actividad 15 de mayo, ..."
            className="w-full p-3 bg-surface-dark rounded-xl border-none outline-none font-bold"
            autoFocus
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-text-muted mb-2">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full p-3 bg-surface-dark rounded-xl border-none outline-none font-bold"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-surface-dark text-dark font-bold rounded-xl"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
          >
            {saving ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}
