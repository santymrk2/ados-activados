import { useState, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';
import { LoginScreen } from './auth/LoginScreen';
import { SettingsPanel } from './auth/SettingsPanel';
import { Loader } from './auth/Loader';
import { Dashboard } from './dashboard/Dashboard';
import { ActivitiesList } from './activities/ActivitiesList';
import { ParticipantsList } from './participants/ParticipantsList';

export default function ActivadosApp() {
  const [view, setView] = useState('dashboard');
  const [modal, setModal] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const { db, isLoading: dbLoading, saveActivity, deleteActivity, quickUpdate, saveParticipant, deleteParticipant } = useDatabase();

  const isLoading = authLoading || dbLoading;

  const handleLogin = useCallback((password) => {
    const result = login(password);
    if (!result.success) {
      setLoginError(result.error);
    } else {
      setLoginError(false);
    }
  }, [login]);

  const handleLogout = useCallback(() => {
    logout();
    setShowSettings(false);
  }, [logout]);

  const openActivityView = (act) => setModal({ type: 'actview', data: act });
  const openActivityEdit = (act) => setModal({ type: 'actedit', data: act });
  const openParticipant = (p) => setModal({ type: 'participant', data: p });
  const openPlayerDetail = (p) => setModal({ type: 'playerdetail', data: p });

  if (isLoading) return <Loader />;

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen 
          onLogin={handleLogin} 
          error={loginError} 
          showPass={showPass} 
          setShowPass={setShowPass} 
        />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-dark font-clash pb-20">
      <Toaster richColors position="top-center" />
      
      {modal?.type === 'actview' && (
        <ActivityViewModal
          db={db}
          act={modal.data}
          onEdit={() => setModal({ type: 'actedit', data: modal.data })}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'actedit' && (
        <ActivityFormModal
          db={db}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={saveActivity}
          onQuickUpdate={quickUpdate}
          onSaveParticipant={saveParticipant}
        />
      )}
      {modal?.type === 'participant' && (
        <ParticipantFormModal
          db={db}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={saveParticipant}
        />
      )}
      {modal?.type === 'playerdetail' && (
        <PlayerDetailModal
          player={modal.data}
          db={db}
          onEdit={() => setModal({ type: 'participant', data: modal.data })}
          onClose={() => setModal(null)}
        />
      )}

      {!modal && (
        <>
          {view === 'dashboard' && (
            <Dashboard 
              db={db} 
              onOpenSettings={() => setShowSettings(true)} 
            />
          )}
          {view === 'activities' && (
            <ActivitiesList
              db={db}
              onView={openActivityView}
              onNew={() => openActivityEdit(null)}
              onEdit={openActivityEdit}
              onDelete={deleteActivity}
            />
          )}
          {view === 'participants' && (
            <ParticipantsList
              db={db}
              onNew={() => openParticipant(null)}
              onEdit={openParticipant}
              onDelete={deleteParticipant}
              onViewDetail={openPlayerDetail}
            />
          )}
          <BottomNav view={view} setView={setView} />
        </>
      )}

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}
      />
    </div>
  );
}

function BottomNav({ view, setView }) {
  const navItems = [
    { key: 'dashboard', Icon: BarChart3 },
    { key: 'activities', Icon: Calendar },
    { key: 'participants', Icon: Users },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg shadow-black/10 border border-surface-dark flex z-50 px-3 py-2 pb-safe">
      {navItems.map(({ key, Icon }) => (
        <button
          key={key}
          onClick={() => setView(key)}
          className={`relative p-2.5 rounded-xl transition-all duration-200 ${
            view === key
              ? 'text-primary bg-primary/10'
              : 'text-text-muted hover:text-dark'
          }`}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </nav>
  );
}

import { BarChart3, Calendar, Users } from 'lucide-react';
import { ActivityViewModal } from './activities/ActivityView';
import { ActivityFormModal } from './activities/ActivityForm';
import { ParticipantFormModal } from './participants/ParticipantForm';
import { PlayerDetailModal } from './participants/PlayerDetail';
