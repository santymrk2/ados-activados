import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LoginScreen({ onLogin, error, showPass, setShowPass }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm border border-surface-dark shadow-xl">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-center mb-2">Acceso Admin</h2>
        <p className="text-text-muted text-sm text-center mb-8">Ingresá tu contraseña para continuar</p>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); }}
              className={cn("input pr-10", error && "border-red-500 focus:border-red-500")}
              style={{ marginBottom: 0 }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-dark bg-transparent border-none cursor-pointer p-1 flex items-center justify-center outline-none"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs text-center mb-4 font-bold">{error}</p>}
          <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl active:scale-95 transition-transform">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
