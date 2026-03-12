import { useState, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { newPart, getEdad } from '../../lib/constants';
import { Modal, Label, SegmentedButtons } from '../ui/Common';
import { SexBadge } from '../ui/Badges';

export function ParticipantFormModal({ db, initial, onClose, onSave }) {
  const [form, setForm] = useState({ ...newPart(), ...initial });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef();

  const F = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhoto = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
        F('foto', canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.nombre.trim()) return toast.error('Ingresá el nombre');
    if (!form.fechaNacimiento) return toast.error('Ingresá la fecha de nacimiento');

    const age = getEdad(form.fechaNacimiento);
    if (age < 0 || age > 100) return toast.error('La fecha de nacimiento no es válida');
    if (age < 12 || age > 18) {
      if (!confirm(`¿Estás seguro que querés agregar a ${form.nombre} con una edad de ${age} años?`)) {
        return;
      }
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    const loadingToast = toast.loading('Guardando...');

    try {
      const isNew = !form.id;
      const p = isNew ? { ...form, id: db.nextPid } : form;
      await onSave(p, isNew);
      toast.dismiss(loadingToast);
      toast.success('Jugador guardado exitosamente');
      onClose();
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error('Error al guardar: ' + e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title={form.id ? 'Editar Jugador' : 'Nuevo Jugador'} onClose={onClose}>
      <div className="flex flex-col items-center mb-5">
        <div
          onClick={() => fileRef.current?.click()}
          className="w-24 h-24 rounded-full bg-surface-dark border-4 border-gray-300 cursor-pointer overflow-hidden flex items-center justify-center"
        >
          {form.foto ? (
            <img src={form.foto} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-4xl">👤</span>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-full bg-surface-dark text-primary font-bold text-sm border border-gray-300">
            📷 Subir foto
          </button>
          {form.foto && (
            <button onClick={() => F('foto', '')} className="px-4 py-2 rounded-full bg-red-50 text-red-500 font-bold text-sm">
              ✕ Quitar
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files[0])} />
      </div>
      <Label>Nombre</Label>
      <input value={form.nombre} onChange={(e) => F('nombre', e.target.value)} placeholder="Nombre" className="input" />
      <Label>Apellido</Label>
      <input value={form.apellido} onChange={(e) => F('apellido', e.target.value)} placeholder="Apellido" className="input" />
      <Label>Fecha de Nacimiento</Label>
      <input value={form.fechaNacimiento} onChange={(e) => F('fechaNacimiento', e.target.value)} type="date" className="input" />
      <Label>Sexo</Label>
      <SegmentedButtons
        options={[
          { val: 'M', label: <span className="flex items-center gap-1"><SexBadge sex="M" /> Varón</span> },
          { val: 'F', label: <span className="flex items-center gap-1"><SexBadge sex="F" /> Mujer</span> },
        ]}
        value={form.sexo}
        onChange={(v) => F('sexo', v)}
      />
      <button onClick={submit} disabled={isSubmitting} className="w-full py-4 bg-primary text-white font-bold text-base rounded-xl border-none cursor-pointer mt-2 disabled:opacity-50">
        {isSubmitting ? 'Cargando...' : form.id ? 'Guardar Cambios' : 'Agregar Jugador'}
      </button>
    </Modal>
  );
}
