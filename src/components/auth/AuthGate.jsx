import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { useApp } from '../../hooks/useApp';
import { LoginScreen } from '../auth/LoginScreen';
import { Loader } from '../auth/Loader';
import { BottomNav } from '../ui/BottomNav';
import { WifiOff, RefreshCw } from 'lucide-react';
import { checkDbConnection } from '../../store/appStore';

function DbErrorScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <WifiOff className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-xl font-black text-red-600 mb-2">Sin conexión a la base de datos</h1>
      <p className="text-text-muted text-sm mb-6 max-w-xs">
        {error?.message || 'No se puede conectar al servidor. Verifica tu conexión a internet.'}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  );
}

export function AuthGate({ children, showNav = true }) {
  const { isAuthenticated, isLoading, login, dbError, dbConnected, refresh } = useApp();
  const [loginError, setLoginError] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleLogin = (password) => {
    const result = login(password);
    if (!result.success) {
      setLoginError(result.error);
    } else {
      setLoginError(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    const isConnected = await checkDbConnection();
    if (isConnected) {
      await refresh();
    }
    setTimeout(() => setIsRetrying(false), 1000);
  };

  if (isLoading || isRetrying) return <Loader />;

  if (!dbConnected && dbError) {
    return (
      <div className="min-h-screen bg-background">
        <DbErrorScreen error={dbError} onRetry={handleRetry} />
        <Toaster richColors position="top-center" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <LoginScreen
          onLogin={handleLogin}
          error={loginError}
          showPass={showPass}
          setShowPass={setShowPass}
        />
        <Toaster richColors position="top-center" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-dark font-clash pb-20">
      <Toaster richColors position="top-center" />
      {children}
      {showNav && <BottomNav />}
    </div>
  );
}
