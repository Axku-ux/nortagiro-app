import React, { useState } from 'react';
import { Activity, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoginViewProps {
  onLogin: (data: { email: string; password: string }) => Promise<void>;
  onGoToRegister: () => void;
}

export function LoginView({ onLogin, onGoToRegister }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLogin({ email, password });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-slate-900" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-white">Norta</span>
              <span className="text-emerald-400">Giro</span>
            </span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6 tracking-tight">
            El pulso de tu
            <br />
            <span className="text-emerald-400">organización</span>,
            <br />
            en tiempo real.
          </h1>
          
          <p className="text-slate-300 text-lg leading-relaxed max-w-md">
            Gure NORTASUNA ahalbidetzeko tresna, ertzainen iritziak kudeatzeko lan tresna.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-slate-900">Norta</span>
              <span className="text-emerald-600">Giro</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-on-background tracking-tight">Bienvenido</h2>
            <p className="text-on-surface-variant mt-2">Ingresa tus credenciales para acceder al panel.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container/30 border border-error-container rounded-xl flex items-start gap-3 animate-in slide-in-from-top duration-300">
              <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-4 py-3 text-base text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-12 py-3 text-base text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group",
                loading
                  ? "bg-primary/70 text-on-primary cursor-wait"
                  : "bg-primary text-on-primary hover:bg-primary-container shadow-sm hover:shadow-md"
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-secondary">
              ¿Primera vez?{' '}
              <button
                type="button"
                onClick={onGoToRegister}
                className="text-primary font-semibold hover:underline transition-colors"
              >
                Configura tu organización
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
