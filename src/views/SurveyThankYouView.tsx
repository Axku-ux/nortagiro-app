import React from 'react';
import { CheckCircle, Heart, ArrowRight } from 'lucide-react';

export function SurveyThankYouView() {
  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/30 text-center relative overflow-hidden">
        {/* Background decors */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>

          <h1 className="text-3xl font-bold text-on-background mb-4 tracking-tight">
            ¡Gracias por tu feedback!
          </h1>
          
          <p className="text-on-surface-variant leading-relaxed mb-8">
            Tus respuestas han sido registradas de forma 100% anónima. Tu opinión es fundamental para construir un mejor entorno de trabajo.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm font-medium text-secondary bg-surface-variant/50 p-4 rounded-2xl">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Valoramos tu honestidad y tiempo.</span>
          </div>

          <button 
            onClick={() => window.close()}
            className="mt-8 w-full bg-surface text-on-surface border border-outline-variant hover:bg-surface-variant font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Cerrar pestaña
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
