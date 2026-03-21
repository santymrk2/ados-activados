import { useState, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { Plus, X, Download, Camera } from 'lucide-react';
import { newPart, getEdad } from '../../lib/constants';
import { Modal, Label, SegmentedButtons } from '../ui/Common';
import { SexBadge } from '../ui/Badges';
import { confirmDialog } from '../../lib/confirm';
import { ImageCropModal } from '../ui/ImageCropModal';
import { downloadBase64Image } from '../../lib/imageUtils';

export function ParticipantFormModal({ db, initial, onClose, onSave }) {
  const [form, setForm] = useState({ ...newPart(), ...initial });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const fileRef = useRef();

  const F = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const handlePhoto = (file) => {
    if (!file) return;
    
    // Validar tipo de archivo real
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('El archivo debe ser una imagen (JPEG, PNG, WebP o GIF)');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.nombre.trim()) return toast.error('Ingresá el nombre');
    if (!form.fechaNacimiento) return toast.error('Ingresá la fecha de nacimiento');

    const age = getEdad(form.fechaNacimiento);
    if (age < 0 || age > 100) return toast.error('La fecha de nacimiento no es válida');
    if (age < 12 || age > 18) {
      if (!(await confirmDialog(`¿Estás seguro que querés agregar a ${form.nombre} con una edad de ${age} años?`, { confirmText: 'Agregar', isDestructive: false }))) {
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

  // Manejar el callback del recorte - recibe ambas imágenes
  const handleCropComplete = (cropped) => {
    F('foto', cropped.thumb);
    F('fotoAltaCalidad', cropped.altaCalidad);
  };

  // Descargar siempre la imagen de alta calidad
  const handleDownload = () => {
    const imagenParaDescargar = form.fotoAltaCalidad || form.foto;
    downloadBase64Image(imagenParaDescargar, `perfil-${form.nombre || 'jugador'}.jpg`);
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
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-xl bg-surface-dark text-primary font-bold text-sm border border-gray-100 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
            <Camera className="w-4 h-4" /> Foto
          </button>
          {form.foto && (
            <>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-teal-50 text-teal-600 font-bold text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
              <button onClick={() => { F('foto', ''); F('fotoAltaCalidad', ''); }} className="px-4 py-2 rounded-xl bg-red-50 text-red-500 font-bold text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
                <X className="w-4 h-4" />
              </button>
            </>
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
          { val: 'M', label: <span className="flex items-center gap-1 px-3 pl-1"><SexBadge sex="M" /> Varones</span> },
          { val: 'F', label: <span className="flex items-center gap-1 px-3 pl-1"><SexBadge sex="F" /> Mujeres</span> },
        ]}
        value={form.sexo}
        onChange={(v) => F('sexo', v)}
      />
      <button onClick={submit} disabled={isSubmitting} className="w-full py-4 bg-primary text-white font-bold text-base rounded-xl border-none cursor-pointer mt-2 disabled:opacity-50">
        {isSubmitting ? 'Cargando...' : form.id ? 'Guardar Cambios' : 'Agregar Jugador'}
      </button>

      {tempImage && (
        <ImageCropModal
          image={tempImage}
          onClose={() => setTempImage(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </Modal>
  );
}
