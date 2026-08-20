import React, { useState } from 'react';
import { Activity, Mail, Lock, User, Building2, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

interface RegisterViewProps {
  onRegister: (data: {
    email: string;
    password: string;
    fullName: string;
    organizationName: string;
  }) => Promise<void>;
  onGoToLogin: () => void;
}

export function RegisterView({ onRegister, onGoToLogin }: RegisterViewProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [organizationName, setOrganizationName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!organizationName.trim() || !fullName.trim()) {
      setError('Completa todos los campos.');
      return;
    }
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await onRegister({ email, password, fullName, organizationName });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la cuenta';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-slate-900" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ClimaPulse 360</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6 tracking-tight">
            Configura tu
            <br />
            <span className="text-emerald-400">espacio de trabajo</span>
          </h1>
          
          <p className="text-slate-400 text-lg leading-relaxed max-w-md mb-10">
            En menos de 2 minutos tendrás tu plataforma de clima organizacional lista para usar.
          </p>
          
          <div className="space-y-4">
            {[
              { icon: Shield, text: 'Datos 100% seguros y encriptados' },
              { icon: User, text: 'Anonimato garantizado para empleados' },
              { icon: Building2, text: 'Personalización completa para tu empresa' },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm text-slate-300">{feature.text}</span>
              </div>
            ))}
          </div>
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
            <span className="text-xl font-bold text-on-background tracking-tight">ClimaPulse 360</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
              step >= 1 ? "bg-primary text-on-primary" : "bg-surface-variant text-on-surface-variant"
            )}>
              1
            </div>
            <div className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              step >= 2 ? "bg-primary" : "bg-surface-variant"
            )} />
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
              step >= 2 ? "bg-primary text-on-primary" : "bg-surface-variant text-on-surface-variant"
            )}>
              2
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-on-background tracking-tight">
              {step === 1 ? 'Tu organización' : 'Tu cuenta'}
            </h2>
            <p className="text-on-surface-variant mt-2">
              {step === 1
                ? 'Configura los datos de tu empresa y tu perfil.'
                : 'Crea tus credenciales de acceso como administrador.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container/30 border border-error-container rounded-xl flex items-start gap-3 animate-in slide-in-from-top duration-300">
              <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
          )}

          {/* Step 1: Organization + Name */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5 animate-in fade-in duration-300">
              <div>
                <label htmlFor="reg-org" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Nombre de la Organización
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                  <input
                    id="reg-org"
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-4 py-3 text-base text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Tu Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="María García"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-4 py-3 text-base text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary-container shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          )}

          {/* Step 2: Credentials */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                  <input
                    id="reg-email"
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
                <label htmlFor="reg-password" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
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

              <div>
                <label htmlFor="reg-confirm" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                  <input
                    id="reg-confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-4 py-3 text-base text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(null); }}
                  className="h-12 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-outline-variant text-secondary hover:bg-surface-variant transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "flex-1 h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group",
                    loading
                      ? "bg-primary/70 text-on-primary cursor-wait"
                      : "bg-primary text-on-primary hover:bg-primary-container shadow-sm hover:shadow-md"
                  )}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Crear Cuenta</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-secondary">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-primary font-semibold hover:underline transition-colors"
              >
                Iniciar sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
