import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, LogOut, User as UserIcon, Loader2 } from 'lucide-react';

const Auth = ({ onUserChange }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      onUserChange(session?.user || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      onUserChange(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [onUserChange]);

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      alert('Error: Asegúrate de que las credenciales de Google estén guardadas en tu panel de Supabase.');
    }
  };

  if (loading) return null;

  if (!session) {
    return (
      <button onClick={handleLogin} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
        <LogIn size={16} />
        <span>Iniciar Sesión</span>
      </button>
    );
  }

  return (
    <div className="auth-user-badge">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {session.user.user_metadata.avatar_url ? (
          <img src={session.user.user_metadata.avatar_url} alt="Profile" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
        ) : (
          <UserIcon size={14} className="text-secondary" />
        )}
        <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
          {session.user.user_metadata.full_name?.split(' ')[0] || 'User'}
        </span>
      </div>
      <div style={{ width: '1px', height: '14px', background: 'var(--border-medium)' }} />
      <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <LogOut size={14} />
      </button>
    </div>
  );
};

export default Auth;
