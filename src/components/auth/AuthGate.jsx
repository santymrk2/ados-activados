import { useState } from 'react';
import { Toaster } from 'sonner';
import { useApp } from '../../hooks/useApp';
import { LoginScreen } from '../auth/LoginScreen';
import { Loader } from '../auth/Loader';

export function AuthGate({ children }) {
  const { isAuthenticated, isLoading, login } = useApp();
  const [loginError, setLoginError] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = (password) => {
    const result = login(password);
    if (!result.success) {
      setLoginError(result.error);
    } else {
      setLoginError(false);
    }
  };

  if (isLoading) return <Loader />;

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
    </div>
  );
}
