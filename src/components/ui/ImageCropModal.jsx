import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getDualCroppedImg } from '../../lib/imageUtils';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

export function ImageCropModal({ image, onCropComplete, onClose }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    try {
      const { altaCalidad, thumb } = await getDualCroppedImg(image, croppedAreaPixels);
      onCropComplete({ altaCalidad, thumb });
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col p-4">
      <div className="flex justify-between items-center mb-4 text-white">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </button>
        <span className="font-bold">Recortar Foto</span>
        <button onClick={handleDone} className="p-2 bg-primary text-white rounded-full">
          <Check className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex-1 rounded-2xl overflow-hidden">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
        />
      </div>

      <div className="mt-6 bg-white/10 p-4 rounded-2xl flex items-center gap-4">
        <ZoomOut className="w-5 h-5 text-white/50" />
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          aria-labelledby="Zoom"
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-primary h-2 rounded-lg appearance-none cursor-pointer bg-white/20"
        />
        <ZoomIn className="w-5 h-5 text-white/50" />
      </div>

      <div className="mt-4 flex gap-2">
        <button 
          onClick={handleDone}
          className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20"
        >
          Confirmar Recorte
        </button>
      </div>
    </div>
  );
}
