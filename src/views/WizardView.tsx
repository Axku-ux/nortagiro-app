import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCampaigns } from '../hooks/useCampaigns';
import { useEmployees, getDepartmentOptions, getLocationOptions } from '../hooks/useEmployees';
import type { QuestionDraft } from '../hooks/useCampaigns';
import type { ReminderConfig } from '../lib/database.types';
import { StepConfig } from '../components/wizard/StepConfig';
import { StepQuestions } from '../components/wizard/StepQuestions';
import { StepAudience } from '../components/wizard/StepAudience';
import { StepReview } from '../components/wizard/StepReview';
import { StepLinks } from '../components/wizard/StepLinks';

const STEPS = [
  { step: 1, label: 'Configuración' },
  { step: 2, label: 'Preguntas' },
  { step: 3, label: 'Audiencia' },
  { step: 4, label: 'Revisión' },
];

export function WizardView({ onBack }: { onBack: () => void }) {
  const { createCampaign, mockQuestions } = useCampaigns();
  const { segmentFields } = useEmployees();

  // Current step (1 to 5, where 5 is the final link distribution step)
  const [currentStep, setCurrentStep] = useState(1);
  const [launching, setLaunching] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);

  // Default dates: Today & 14 days later
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultEndStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Step 1: Config
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');

  // Step 2: Questions
  const [questions, setQuestions] = useState<QuestionDraft[]>(mockQuestions);

  // Step 3: Audience Filters
  const currentDepts = getDepartmentOptions(segmentFields);
  const currentLocs = getLocationOptions(segmentFields);
  
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(currentDepts);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(currentLocs);

  // Keep audience selection synced with segmentFields when segmentFields change or load
  useEffect(() => {
    const depts = getDepartmentOptions(segmentFields);
    const locs = getLocationOptions(segmentFields);
    setSelectedDepartments(depts);
    setSelectedLocations(locs);
  }, [segmentFields]);

  // Step 4: Schedule + Review
  const [startsAt, setStartsAt] = useState(todayStr);
  const [endsAt, setEndsAt] = useState(defaultEndStr);
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>({
    enabled: true,
    first_reminder_days: 3,
    final_reminder_hours: 24,
  });

  // ─── Validation per step ──────────────────────────────

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1: return title.trim().length > 0;
      case 2: return questions.length > 0;
      case 3: return selectedDepartments.length > 0 && selectedLocations.length > 0;
      case 4: return title.trim().length > 0 && questions.length > 0;
      default: return true;
    }
  };

  const goNext = () => {
    if (currentStep === 4) {
      handleLaunch();
    } else if (currentStep < 4 && canProceed(currentStep)) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1 && currentStep < 5) {
      setCurrentStep((s) => s - 1);
    } else if (currentStep === 1) {
      onBack();
    }
  };

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      const campaignId = await createCampaign({
        title,
        description,
        periodLabel: periodLabel || `Campaña ${startsAt} - ${endsAt}`,
        startsAt,
        endsAt,
        reminderConfig,
        questions,
        audienceEmployeeIds: [],
      });

      setCreatedCampaignId(campaignId);
      setCurrentStep(5); // Move to links distribution step
    } catch (err) {
      console.error('Error creating campaign:', err);
    } finally {
      setLaunching(false);
    }
  };

  // ─── Stepper state computation ────────────────────────

  const getStepState = (step: number): 'completed' | 'active' | 'pending' => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'pending';
  };

  const progressWidth = currentStep === 5 ? '100%' : `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`;

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-[1440px] mx-auto animate-in fade-in duration-500 pb-32">
      {/* Header & Stepper */}
      {currentStep < 5 && (
        <div className="mb-8 text-center md:text-left max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight text-on-background">
            {currentStep === 1 && 'Configuración de Campaña'}
            {currentStep === 2 && 'Diseña tu Encuesta'}
            {currentStep === 3 && 'Estrategia de Distribución'}
            {currentStep === 4 && 'Revisión y Lanzamiento'}
          </h1>

          {/* Stepper */}
          <div className="flex items-center justify-between relative mt-8">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-[2px] bg-outline-variant -z-10" />
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 h-[2px] bg-primary -z-10 transition-all duration-500"
              style={{ width: progressWidth }}
            />

            {STEPS.map((s) => {
              const state = getStepState(s.step);
              return (
                <div key={s.step} className="flex flex-col items-center gap-2 bg-background px-2">
                  <button
                    onClick={() => s.step < currentStep && setCurrentStep(s.step)}
                    disabled={state === 'pending'}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      state === 'completed' ? "bg-primary text-on-primary cursor-pointer hover:bg-primary-container" :
                      state === 'active' ? "bg-primary text-on-primary ring-4 ring-primary/20" :
                      "bg-surface-variant text-on-surface-variant border border-outline-variant"
                    )}
                  >
                    {state === 'completed' ? <Check className="w-4 h-4" /> : s.step}
                  </button>
                  <span className={cn(
                    "text-xs font-semibold hidden md:block",
                    state === 'pending' ? "text-on-surface-variant" : "text-primary"
                  )}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="max-w-6xl mx-auto">
        {currentStep === 1 && (
          <StepConfig
            title={title}
            description={description}
            periodLabel={periodLabel}
            startsAt={startsAt}
            endsAt={endsAt}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onPeriodLabelChange={setPeriodLabel}
            onStartsAtChange={setStartsAt}
            onEndsAtChange={setEndsAt}
          />
        )}
        {currentStep === 2 && (
          <StepQuestions
            questions={questions}
            onQuestionsChange={setQuestions}
          />
        )}
        {currentStep === 3 && (
          <StepAudience
            segmentFields={segmentFields}
            selectedDepartments={selectedDepartments}
            selectedLocations={selectedLocations}
            onDepartmentsChange={setSelectedDepartments}
            onLocationsChange={setSelectedLocations}
          />
        )}
        {currentStep === 4 && (
          <StepReview
            title={title}
            description={description}
            periodLabel={periodLabel || `${startsAt} al ${endsAt}`}
            questions={questions}
            audienceCount={selectedDepartments.length * selectedLocations.length}
            startsAt={startsAt}
            endsAt={endsAt}
            reminderConfig={reminderConfig}
            onStartsAtChange={setStartsAt}
            onEndsAtChange={setEndsAt}
            onReminderConfigChange={setReminderConfig}
            onLaunch={handleLaunch}
            launching={launching}
          />
        )}
        {currentStep === 5 && createdCampaignId && (
          <StepLinks
            campaignId={createdCampaignId}
            segmentFields={segmentFields}
            selectedDepartments={selectedDepartments}
            selectedLocations={selectedLocations}
            onFinish={onBack}
          />
        )}
      </div>

      {/* Navigation footer */}
      {currentStep < 5 && (
        <div className="max-w-6xl mx-auto flex justify-between items-center border-t border-outline-variant pt-4 fixed bottom-0 left-0 md:left-64 right-0 bg-surface/90 backdrop-blur-md px-4 md:px-8 z-40 pb-5">
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-secondary border border-outline-variant hover:bg-surface-variant transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
            {currentStep === 1 ? 'Cancelar' : 'Atrás'}
          </button>
          <button
            onClick={goNext}
            disabled={!canProceed(currentStep) || launching}
            className={cn(
              "flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm",
              canProceed(currentStep) && !launching
                ? "bg-primary text-on-primary hover:bg-primary-container shadow-md"
                : "bg-surface-variant text-outline cursor-not-allowed"
            )}
          >
            {launching ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{currentStep === 4 ? 'Lanzar Campaña' : 'Siguiente'}</span>
                <ArrowRight className="w-[18px] h-[18px]" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
