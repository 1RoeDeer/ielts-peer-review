import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'IELTS-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

interface CreateClassroomModalProps { onClose: () => void; }

const CreateClassroomModal: React.FC<CreateClassroomModalProps> = ({ onClose }) => {
  const { currentUser, createClassroom } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code] = useState(generateCode);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    if (!name.trim() || !currentUser || isCreating) return;
    setIsCreating(true);
    try {
      if (await createClassroom({ name: name.trim(), description: description.trim(), code, color: 'neutral', teacherId: currentUser.id })) onClose();
    } finally { setIsCreating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto animate-scale-in"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Create New Classroom</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 6 }}><X size={15} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="section-label block mb-2">Class Name *</label>
            <input type="text" value={name} maxLength={120} onChange={(e) => setName(e.target.value.slice(0, 120))}
              placeholder="e.g. IELTS Academic Writing — Batch C" className="input-field" />
          </div>
          <div>
            <label className="section-label block mb-2">Description</label>
            <textarea value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
              placeholder="Brief description..." className="textarea-field h-20 text-sm" />
          </div>
          <div>
            <label className="section-label block mb-2">Join Code</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
              style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-inset)' }}>
              <code className="flex-1 text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{code}</code>
              <button onClick={handleCopy} className="btn-ghost text-xs flex items-center gap-1" style={{ padding: '4px 8px' }}>
                {copied ? <><Check size={12} style={{ color: '#16a34a' }} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Share this code with students to join.</p>
          </div>
        </div>
        <div className="flex gap-3 p-5" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleCreate} disabled={!name.trim() || isCreating} className="btn-primary flex-1 justify-center">
            {isCreating ? 'Creating…' : 'Create Classroom'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateClassroomModal;
