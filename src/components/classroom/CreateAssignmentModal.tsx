import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { useStore } from '../../store/useStore';
import CharCounter from '../ui/CharCounter';
import type { EssayType } from '../../types';

const MAX_PROMPT_CHARS = 3000;

const ESSAY_TYPES: { value: EssayType; label: string }[] = [
  { value: 'opinion', label: 'Opinion Essay' },
  { value: 'discussion', label: 'Discussion Essay' },
  { value: 'problem-solution', label: 'Problem-Solution' },
  { value: 'advantages-disadvantages', label: 'Advantages & Disadvantages' },
  { value: 'task1', label: 'Task 1 (Academic)' },
];

interface CreateAssignmentModalProps {
  classroomId: string;
  onClose: () => void;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ classroomId, onClose }) => {
  const { createAssignment } = useStore();
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [essayType, setEssayType] = useState<EssayType>('opinion');
  const [deadline, setDeadline] = useState('');
  const [minWords, setMinWords] = useState(250);
  const [requiredReviews, setRequiredReviews] = useState(2);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !prompt.trim() || !deadline || isCreating) return;
    setIsCreating(true);
    try { const saved = await createAssignment({
      classroomId,
      title: title.trim(),
      prompt: prompt.trim(),
      essayType,
      deadline: new Date(deadline).toISOString(),
      minWords,
      requiredReviews,
    });
    if (saved) onClose();
    } finally { setIsCreating(false); }
  };

  const isValid = title.trim() && prompt.trim() && deadline;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in max-h-[calc(100dvh-2rem)] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/40 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-200">Create Assignment</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Assignment Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Opinion Essay: Technology in Education" className="input-field" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Essay Type</label>
            <div className="grid grid-cols-2 gap-2">
              {ESSAY_TYPES.map((t) => (
                <button key={t.value} onClick={() => setEssayType(t.value)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                    essayType === t.value
                      ? 'bg-blue-900/40 border-blue-500/60 text-blue-200 shadow-sm shadow-blue-500/10'
                      : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:border-slate-600'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Essay Prompt *</label>
              <span className="text-[11px] font-mono text-slate-500">
                {prompt.length} / {MAX_PROMPT_CHARS}
              </span>
            </div>
            <textarea
              value={prompt}
              maxLength={MAX_PROMPT_CHARS}
              onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_CHARS))}
              placeholder="Write the full task prompt here..."
              className="textarea-field h-32 text-sm"
            />
            <CharCounter value={prompt} max={MAX_PROMPT_CHARS} warnAt={600} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Min Words</label>
              <input type="number" value={minWords} onChange={(e) => setMinWords(parseInt(e.target.value) || 150)}
                min={100} max={500} className="input-field" />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Reviews Req.</label>
              <input type="number" value={requiredReviews} onChange={(e) => setRequiredReviews(parseInt(e.target.value) || 1)}
                min={1} max={5} className="input-field" />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                <Calendar size={11} /> Deadline *
              </label>
              <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="input-field text-sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-700/40 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleCreate} disabled={!isValid || isCreating}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
            {isCreating ? 'Publishing…' : 'Publish Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
