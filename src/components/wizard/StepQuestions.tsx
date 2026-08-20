import React, { useState } from 'react';
import { Plus, GripVertical, Trash2, MessageSquareText, Tag } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { QuestionDraft } from '../../hooks/useCampaigns';

interface StepQuestionsProps {
  questions: QuestionDraft[];
  onQuestionsChange: (questions: QuestionDraft[]) => void;
}

const DIMENSION_PRESETS = ['Liderazgo', 'Crecimiento', 'Reconocimiento', 'Bienestar', 'Comunicación', 'Cultura', 'General'];

export function StepQuestions({ questions, onQuestionsChange }: StepQuestionsProps) {
  const [newText, setNewText] = useState('');
  const [newDimension, setNewDimension] = useState('General');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const addQuestion = () => {
    if (!newText.trim()) return;
    const updated = [
      ...questions,
      { text: newText.trim(), dimension: newDimension, orderIndex: questions.length, isRequired: true },
    ];
    onQuestionsChange(updated);
    setNewText('');
    setNewDimension('General');
  };

  const removeQuestion = (index: number) => {
    const updated = questions
      .filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, orderIndex: i }));
    onQuestionsChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const updated = [...questions];
    const [dragged] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, dragged);
    onQuestionsChange(updated.map((q, i) => ({ ...q, orderIndex: i })));
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  // Group questions by dimension for the summary
  const dimensionCounts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.dimension] = (acc[q.dimension] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-on-surface-variant">{questions.length} preguntas</span>
        {Object.entries(dimensionCounts).map(([dim, count]) => (
          <span key={dim} className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
            {dim}: {count}
          </span>
        ))}
      </div>

      {/* Question list */}
      <div className="space-y-2">
        {questions.map((q, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className={cn(
              "card p-4 flex items-start gap-3 group cursor-move transition-all",
              dragIndex === i && "opacity-50 scale-[0.98] border-primary"
            )}
          >
            <GripVertical className="w-5 h-5 text-outline mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-on-background leading-relaxed">{q.text}</p>
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                <Tag className="w-3 h-3" />
                {q.dimension}
              </span>
            </div>
            <button
              onClick={() => removeQuestion(i)}
              className="text-outline hover:text-error transition-colors opacity-0 group-hover:opacity-100 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add question form */}
      <div className="card p-6 border-dashed border-2">
        <h3 className="text-sm font-semibold text-on-background mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Añadir Pregunta
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="q-text" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
              <MessageSquareText className="w-3.5 h-3.5 inline mr-1" />
              Texto de la pregunta
            </label>
            <textarea
              id="q-text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Escribe la pregunta que verán los empleados..."
              rows={2}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-base text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  addQuestion();
                }
              }}
            />
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label htmlFor="q-dim" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                Dimensión
              </label>
              <select
                id="q-dim"
                value={newDimension}
                onChange={(e) => setNewDimension(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all cursor-pointer"
              >
                {DIMENSION_PRESETS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <button
              onClick={addQuestion}
              disabled={!newText.trim()}
              className={cn(
                "h-10 px-5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
                newText.trim()
                  ? "bg-primary text-on-primary hover:bg-primary-container shadow-sm"
                  : "bg-surface-variant text-outline cursor-not-allowed"
              )}
            >
              <Plus className="w-4 h-4" />
              Añadir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
