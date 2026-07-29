import React, { useState } from 'react';
import { ScreenState } from '../types';
import { supabase } from '../lib/supabase';
import { setToken } from '../lib/api';
import { Lock, User, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';

interface SignupScreenProps {
  onNavigate: (screen: ScreenState) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ onNavigate, showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      // If email confirmation is disabled in Supabase, session is available immediately
      if (data.session?.access_token) {
        setToken(data.session.access_token);
        showToast('success', 'Account created! Welcome to Quran-By-Ear.');
        onNavigate('surah-list');
      } else {
        // Email confirmation required
        showToast('info', 'Check your email to confirm your account, then log in.');
        onNavigate('login');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => onNavigate('login')}
          className="absolute top-6 left-6 p-2 rounded-full bg-surface-2 border border-border text-fg-muted hover:text-fg transition-colors active-scale"
          aria-label="Back to login"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4 mt-8">
          <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center border border-accent/30 shadow-lg">
            <span className="text-3xl">📖</span>
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-fg tracking-tight">Create Account</h2>
        <p className="mt-1 text-center text-xs text-fg-muted">
          Join Quran-By-Ear to track your memorization journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 shadow-xl rounded-2xl border border-border">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 flex items-start gap-2.5 text-red-200 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-fg-muted mb-1.5">Email</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-fg-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-surface-2 border border-border rounded-xl text-fg text-sm placeholder-fg-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg-muted mb-1.5">Password</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-fg-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="block w-full pl-10 pr-3 py-2.5 bg-surface-2 border border-border rounded-xl text-fg text-sm placeholder-fg-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg-muted mb-1.5">Confirm Password</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-fg-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="block w-full pl-10 pr-3 py-2.5 bg-surface-2 border border-border rounded-xl text-fg text-sm placeholder-fg-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 text-sm font-bold shadow-lg active-scale disabled:opacity-50 transition-colors mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-fg-muted">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="font-semibold text-accent hover:underline"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
