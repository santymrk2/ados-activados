import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './AppProvider';
import { LoginScreen } from './auth/LoginScreen';
import { Loader } from './auth/Loader';
import DashboardPage from './pages/DashboardPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityPage from './pages/ActivityPage';
import ParticipantsPage from './pages/ParticipantsPage';
import { ActivityFormModal } from './activities/ActivityForm';
import { ParticipantFormModal } from './participants/ParticipantForm';
import { PlayerDetailModal } from './participants/PlayerDetail';
import { BarChart3, Calendar, Users } from 'lucide-react';

function AuthWrapper() {
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

  return <AppRoutes />;
}

function AppRoutes() {
  const location = useLocation();
  const isModal = location.pathname.includes('/new') || location.pathname.includes('/edit') || location.pathname.match(/\/\d+$/);

  return (
    <div className="min-h-screen bg-background text-dark font-clash pb-20">
      <Toaster richColors position="top-center" />
      
      <div className={isModal ? '' : ''}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/new" element={<ActivityFormWrapper mode="new" />} />
          <Route path="/activities/:id" element={<ActivityPage />} />
          <Route path="/activities/:id/edit" element={<ActivityFormWrapper mode="edit" />} />
          <Route path="/participants" element={<ParticipantsPage />} />
          <Route path="/participants/new" element={<ParticipantFormWrapper mode="new" />} />
          <Route path="/participants/:id" element={<PlayerDetailWrapper />} />
          <Route path="/participants/:id/edit" element={<ParticipantFormWrapper mode="edit" />} />
        </Routes>
      </div>

      {!isModal && <BottomNav />}
    </div>
  );
}

function ActivityFormWrapper({ mode }) {
  const { db } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const { saveActivity, quickUpdate, saveParticipant } = useApp();
  
  const activity = mode === 'edit' ? db.activities.find(a => a.id === Number(id)) : null;
  
  return (
    <ActivityFormModal
      db={db}
      initial={activity}
      onClose={() => navigate(-1)}
      onSave={saveActivity}
      onQuickUpdate={quickUpdate}
      onSaveParticipant={saveParticipant}
    />
  );
}

function ParticipantFormWrapper({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { db, saveParticipant } = useApp();
  
  const participant = mode === 'edit' ? db.participants.find(p => p.id === Number(id)) : null;
  
  return (
    <ParticipantFormModal
      db={db}
      initial={participant}
      onClose={() => navigate(-1)}
      onSave={saveParticipant}
    />
  );
}

function PlayerDetailWrapper() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { db } = useApp();
  
  const participant = db.participants.find(p => p.id === Number(id));
  
  if (!participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Jugador no encontrado</p>
          <button onClick={() => navigate('/participants')} className="text-primary font-bold mt-2">
            Volver a jugadores
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <PlayerDetailModal
      player={participant}
      db={db}
      onEdit={() => navigate(`/participants/${id}/edit`)}
      onClose={() => navigate(-1)}
    />
  );
}

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { key: '/', Icon: BarChart3, label: 'Dashboard' },
    { key: '/activities', Icon: Calendar, label: 'Actividades' },
    { key: '/participants', Icon: Users, label: 'Jugadores' },
  ];

  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg shadow-black/10 border border-surface-dark flex z-50 px-3 py-2 pb-safe">
      {navItems.map(({ key, Icon, label }) => {
        const isActive = currentPath === key || (key !== '/' && currentPath.startsWith(key));
        return (
          <button
            key={key}
            onClick={() => navigate(key)}
            className={`relative p-2.5 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-primary bg-primary/10'
                : 'text-text-muted hover:text-dark'
            }`}
            title={label}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthWrapper />
      </AppProvider>
    </BrowserRouter>
  );
}
