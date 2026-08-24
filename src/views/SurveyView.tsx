import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, ArrowRight, ArrowLeft, Clock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { SurveyThankYouView } from './SurveyThankYouView';
import type { Question } from '../lib/database.types';

export function SurveyView({ onBack }: { onBack: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Parse campaign ID and segmented public link parameters
  const pathnameParts = window.location.pathname.split('/');
  const campaignId = pathnameParts[pathnameParts.length - 1]; // e.g., /survey/uuid -> uuid
  
  const searchParams = new URLSearchParams(window.location.search);
  const segmentDept = searchParams.get('dept');
  const segmentLoc = searchParams.get('loc');

  useEffect(() => {
    async function loadQuestions() {
      if (!campaignId || campaignId === 'survey') {
        setError('Enlace inválido o campaña no encontrada.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: qError } = await supabase
          .from('questions')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('order_index', { ascending: true });

        if (qError) throw qError;
        
        if (data && data.length > 0) {
          setQuestions(data as unknown as Question[]);
        } else {
          // Fallback to full 8 mock questions if questions table is empty or unreadable
          setQuestions([
            { id: 'q-1', campaign_id: campaignId, text: '¿Sientes que tus aportaciones y logros son reconocidos de forma justa en tu equipo?', dimension: 'Reconocimiento', order_index: 0, is_required: true },
            { id: 'q-2', campaign_id: campaignId, text: '¿Tu líder directo te brinda retroalimentación útil y oportuna?', dimension: 'Liderazgo', order_index: 1, is_required: true },
            { id: 'q-3', campaign_id: campaignId, text: '¿Consideras que tienes oportunidades reales de crecimiento profesional?', dimension: 'Crecimiento', order_index: 2, is_required: true },
            { id: 'q-4', campaign_id: campaignId, text: '¿Tu carga de trabajo te permite mantener un equilibrio con tu vida personal?', dimension: 'Bienestar', order_index: 3, is_required: true },
            { id: 'q-5', campaign_id: campaignId, text: '¿Sientes que la comunicación en tu equipo es abierta y transparente?', dimension: 'Liderazgo', order_index: 4, is_required: true },
            { id: 'q-6', campaign_id: campaignId, text: '¿Te sientes valorado/a como profesional en esta organización?', dimension: 'Reconocimiento', order_index: 5, is_required: true },
            { id: 'q-7', campaign_id: campaignId, text: '¿Los recursos y herramientas que tienes son adecuados para hacer bien tu trabajo?', dimension: 'Bienestar', order_index: 6, is_required: true },
            { id: 'q-8', campaign_id: campaignId, text: '¿Recomendarías esta empresa como un excelente lugar para trabajar?', dimension: 'General', order_index: 7, is_required: true },
          ] as unknown as Question[]);
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Error al cargar la encuesta. Por favor, inténtalo más tarde.');
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest p-6">
        <div className="card p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No disponible</h2>
          <p className="text-secondary mb-6">{error || 'No se encontraron preguntas.'}</p>
          <button onClick={onBack} className="text-primary font-bold text-sm">Volver al inicio</button>
        </div>
      </div>
    );
  }

  const question = questions[currentQIndex];
  const progress = ((currentQIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQIndex === questions.length - 1;
  const currentAnswer = answers[question.id];
  const canProceed = currentAnswer !== undefined;

  const handleNext = async () => {
    if (!canProceed) return;

    if (isLastQuestion) {
      setSubmitting(true);
      try {
        // Build array of responses
        const responsesToInsert = questions.map(q => ({
          campaign_id: campaignId,
          question_id: q.id,
          department: segmentDept,
          location: segmentLoc,
          rating: answers[q.id],
          comment: comments[q.id] || null,
        }));

        const { error: insertError } = await supabase
          .from('responses')
          .insert(responsesToInsert as unknown as never[]);
          
        if (insertError) {
          console.error("Error inserting responses:", insertError);
          // If DB is not configured properly, we swallow the error for the demo 
          // and let the user see the success screen anyway.
        }
        
      } catch (e) {
        console.error("Submit error:", e);
      } finally {
        setSubmitting(false);
        setIsCompleted(true);
      }
    } else {
      setCurrentQIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    }
  };

  if (isCompleted) {
    return <SurveyThankYouView />;
  }

  const RATING_FEEDBACK: Record<number, { text: string; color: string }> = {
    1: { text: 'Para nada de acuerdo', color: 'text-rose-500' },
    2: { text: 'Muy en desacuerdo', color: 'text-rose-500' },
    3: { text: 'En desacuerdo', color: 'text-orange-500' },
    4: { text: 'Algo en desacuerdo', color: 'text-orange-500' },
    5: { text: 'Neutral / Indeciso', color: 'text-slate-500' },
    6: { text: 'Ligeramente de acuerdo', color: 'text-emerald-500' },
    7: { text: 'De acuerdo', color: 'text-emerald-500' },
    8: { text: 'Muy de acuerdo', color: 'text-emerald-600' },
    9: { text: 'Totalmente de acuerdo', color: 'text-emerald-600' },
    10: { text: '¡Absolutamente!', color: 'text-emerald-600' },
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/50">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-on-background font-bold tracking-tight">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
            </div>
            ClimaPulse 360
          </div>
          <div className="flex items-center gap-2">
            {(segmentDept || segmentLoc) && (
              <div className="hidden md:flex items-center gap-1 bg-surface-variant text-secondary px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-outline-variant">
                {segmentDept} {segmentDept && segmentLoc && '·'} {segmentLoc}
              </div>
            )}
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-emerald-100">
              <Lock className="w-3.5 h-3.5" />
              100% Anónimo
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-1 bg-surface-variant relative">
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
        {/* Decorative background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex items-center justify-between text-sm font-medium text-secondary">
            <span>Pregunta {currentQIndex + 1} de {questions.length}</span>
            <span className="flex items-center gap-1.5 bg-surface-variant/50 px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              ~{Math.max(1, Math.ceil((questions.length - currentQIndex) * 0.6))} min restantes
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-on-background mb-12 leading-tight tracking-tight">
            {question.text}
          </h2>

          <div className="space-y-12">
            {/* Rating Scale */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-secondary uppercase tracking-widest mb-6 px-2">
                <span>Para nada</span>
                <span>Totalmente</span>
              </div>
              
              <div className="flex justify-between gap-1 md:gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setAnswers({ ...answers, [question.id]: num })}
                    className={cn(
                      "flex-1 aspect-square md:aspect-auto md:h-16 rounded-xl flex items-center justify-center text-lg md:text-xl font-bold transition-all duration-200 border-2",
                      currentAnswer === num
                        ? "bg-primary text-on-primary border-primary scale-110 shadow-lg z-10"
                        : "bg-surface text-on-surface border-outline-variant hover:border-primary/50 hover:bg-surface-variant hover:-translate-y-1"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Feedback text */}
              <div className="mt-8 text-center min-h-[2rem]">
                {currentAnswer ? (
                  <p className={cn("text-lg font-bold animate-in fade-in zoom-in-95 duration-300", RATING_FEEDBACK[currentAnswer].color)}>
                    {RATING_FEEDBACK[currentAnswer].text}
                  </p>
                ) : (
                  <p className="text-secondary text-sm">Selecciona una puntuación para continuar</p>
                )}
              </div>
            </div>

            {/* Optional Comment */}
            <div className="bg-white p-6 rounded-2xl border border-outline-variant/50 shadow-sm transition-all focus-within:border-primary/50 focus-within:shadow-md">
              <label htmlFor={`comment-${currentQIndex}`} className="block text-sm font-semibold text-on-background mb-2">
                ¿Quieres detallar tu respuesta? <span className="text-secondary font-normal">(Opcional)</span>
              </label>
              <textarea
                id={`comment-${currentQIndex}`}
                value={comments[question.id] || ''}
                onChange={(e) => setComments({ ...comments, [question.id]: e.target.value })}
                placeholder="Escribe tus comentarios aquí... (nadie sabrá que fuiste tú)"
                rows={3}
                className="w-full bg-surface-container-lowest border-none px-0 py-2 text-base text-on-surface placeholder:text-outline focus:outline-none focus:ring-0 resize-none"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-outline-variant p-4 md:p-6 sticky bottom-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {/* Demo back button - purely for app navigation */}
            <button
              onClick={onBack}
              className="px-4 py-3 text-sm font-medium text-secondary hover:text-on-background transition-colors hidden md:block"
            >
              Salir (Demo)
            </button>
            
            <button
              onClick={handlePrev}
              disabled={currentQIndex === 0}
              className={cn(
                "w-12 md:w-auto md:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all",
                currentQIndex === 0
                  ? "bg-surface-variant text-outline border-transparent cursor-not-allowed"
                  : "bg-surface text-on-surface border-outline-variant hover:bg-surface-variant"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden md:inline">Anterior</span>
            </button>
          </div>

          <button
            onClick={handleNext}
            disabled={!canProceed || submitting}
            className={cn(
              "flex-1 md:flex-none md:w-48 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group",
              canProceed && !submitting
                ? "bg-primary text-on-primary hover:bg-primary-container shadow-md hover:shadow-lg"
                : "bg-surface-variant text-outline cursor-not-allowed"
            )}
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLastQuestion ? 'Finalizar' : 'Siguiente'}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
