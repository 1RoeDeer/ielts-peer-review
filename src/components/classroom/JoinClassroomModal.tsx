import React, { useState } from 'react';
import { X, LogIn, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface JoinClassroomModalProps { onClose: () => void; }

const JoinClassroomModal: React.FC<JoinClassroomModalProps> = ({ onClose }) => {
  const { joinClassroom } = useStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleJoin = () => {
    setError('');
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError('Пожалуйста, введите код класса.'); return; }
    const res = joinClassroom(trimmed);
    if (res.success) {
      setSuccess(true);
      setTimeout(onClose, 1200);
    } else {
      if (res.reason === 'already_joined') {
        setError('Вы уже состоите в этом классе.');
      } else if (res.reason === 'teacher_owner') {
        setError('Вы являетесь преподавателем этого класса.');
      } else {
        setError('Класс с таким кодом не найден. Проверьте код и попробуйте снова.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Join a Classroom</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 6 }}><X size={15} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Enter the classroom code provided by your teacher.
          </p>
          <div>
            <label className="section-label block mb-2">Classroom Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="e.g. IELTS-A7X2"
              className="input-field font-mono text-center tracking-widest text-base"
              autoFocus
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#b91c1c' }}>
              <AlertCircle size={13} />
              {error}
            </div>
          )}
          {success && (
            <div className="px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', color: '#15803d' }}>
              ✓ Successfully joined! Redirecting...
            </div>
          )}
          <div className="px-3 py-2.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Demo codes:{' '}
            <code className="font-mono" style={{ color: 'var(--text-secondary)' }}>IELTS-A7X2</code> ·{' '}
            <code className="font-mono" style={{ color: 'var(--text-secondary)' }}>IELTS-G9K1</code> ·{' '}
            <code className="font-mono" style={{ color: 'var(--text-secondary)' }}>IELTS-W4P8</code>
          </div>
        </div>
        <div className="flex gap-3 p-5" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleJoin} className="btn-primary flex-1 justify-center">
            <LogIn size={14} /> Join Class
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinClassroomModal;
