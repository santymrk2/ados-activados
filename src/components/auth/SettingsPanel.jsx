import { useState, useEffect } from 'react';
import { Settings, LogOut, X, Palette, Save } from 'lucide-react';
import { TEAMS, getTeamColors, saveTeamColors, syncTeamConstants } from '../../lib/constants';

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  return getLuminance(rgb.r, rgb.g, rgb.b) > 0.5 ? '#000000' : '#ffffff';
}

export function SettingsPanel({ isOpen, onClose, onLogout }) {
  const [colors, setColors] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setColors(getTeamColors());
      setSaved(false);
    }
  }, [isOpen]);

  const handleColorChange = (team, color) => {
    setColors(prev => ({ ...prev, [team]: color }));
    setSaved(false);
  };

  const handleSave = () => {
    saveTeamColors(colors);
    syncTeamConstants();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-surface-dark sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="font-black text-lg">Configuración</div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-surface-dark flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <div className="font-bold">Colores de Equipos</div>
          </div>
          
          <div className="space-y-3 mb-4">
            {TEAMS.map(team => (
              <div key={team} className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
                  style={{ 
                    backgroundColor: colors[team] || '#cccccc',
                    color: getContrastColor(colors[team] || '#cccccc')
                  }}
                >
                  {team}
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text-muted font-bold block mb-1">
                    Color {team}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={colors[team] || '#cccccc'}
                      onChange={(e) => handleColorChange(team, e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-none"
                    />
                    <input
                      type="text"
                      value={colors[team] || '#cccccc'}
                      onChange={(e) => handleColorChange(team, e.target.value)}
                      className="flex-1 p-2 bg-surface-dark rounded-lg text-sm font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold ${
              saved 
                ? 'bg-green-500 text-white' 
                : 'bg-primary text-white'
            }`}
          >
            <Save className="w-5 h-5" />
            {saved ? '¡Guardado!' : 'Guardar Colores'}
          </button>
        </div>

        <div className="p-4 border-t border-surface-dark">
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
