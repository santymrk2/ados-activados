import { toast } from 'sonner';

export function confirmDialog(message) {
  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div className="bg-white rounded-xl p-4 shadow-lg border border-surface-dark max-w-sm">
          <p className="text-dark font-medium mb-4">{message}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.dismiss(t);
                resolve(true);
              }}
              className="flex-1 py-2 bg-red-500 text-white font-bold rounded-lg"
            >
              Eliminar
            </button>
            <button
              onClick={() => {
                toast.dismiss(t);
                resolve(false);
              }}
              className="flex-1 py-2 bg-surface-dark text-dark font-bold rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  });
}
