import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AppShell from '../components/layout/AppShell';
import { mockUsers } from '../data/mockData';
import {
  BookOpen, ArrowRight, Plus, Users, FileText,
} from 'lucide-react';
import { useState } from 'react';
import CreateClassroomModal from '../components/classroom/CreateClassroomModal';
import JoinClassroomModal from '../components/classroom/JoinClassroomModal';

const ClassroomsPage: React.FC = () => {
  const { currentUser, classrooms, assignments } = useStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const isTeacher = currentUser?.role === 'teacher';
  const myClassrooms = classrooms.filter((c) =>
    isTeacher ? c.teacherId === currentUser?.id : c.studentIds.includes(currentUser?.id || '')
  );

  const getClassroomColor = (color: string) => {
    const map: Record<string, string> = {
      violet: 'from-violet-600 to-indigo-600',
      indigo: 'from-indigo-600 to-blue-600',
      teal: 'from-teal-600 to-cyan-600',
      rose: 'from-rose-600 to-pink-600',
      amber: 'from-amber-600 to-orange-600',
    };
    return map[color] || 'from-slate-600 to-slate-700';
  };

  return (
    <AppShell title={isTeacher ? 'My Classrooms' : 'Enrolled Classes'}>
      <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{isTeacher ? 'My Classrooms' : 'Enrolled Classes'}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {myClassrooms.length} classroom{myClassrooms.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => isTeacher ? setShowCreate(true) : setShowJoin(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            {isTeacher ? 'Create Classroom' : 'Join Classroom'}
          </button>
        </div>

        {myClassrooms.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <BookOpen size={48} className="text-slate-700 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-400 mb-2">No classrooms yet</h2>
            <p className="text-slate-600 text-sm mb-6">
              {isTeacher ? 'Create your first classroom to get started.' : 'Join a classroom with your code.'}
            </p>
            <button
              onClick={() => isTeacher ? setShowCreate(true) : setShowJoin(true)}
              className="btn-primary"
            >
              {isTeacher ? 'Create Classroom' : 'Join Classroom'}
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myClassrooms.map((classroom) => {
              const classAssignments = assignments.filter((a) => a.classroomId === classroom.id);
              const teacher = mockUsers.find((u) => u.id === classroom.teacherId);

              return (
                <button
                  key={classroom.id}
                  onClick={() => navigate(`/classrooms/${classroom.id}`)}
                  className="glass-card text-left p-0 overflow-hidden hover:border-slate-600/60 hover:scale-[1.02] transition-all group"
                >
                  {/* Color bar + gradient header */}
                  <div className={`h-24 bg-gradient-to-br ${getClassroomColor(classroom.color)} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="text-white/40 text-xs font-mono">{classroom.code}</div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <ArrowRight size={16} className="text-white/50 group-hover:text-white/90 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white leading-tight mb-1">
                      {classroom.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{classroom.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Users size={11} /> {classroom.studentIds.length}</span>
                        <span className="flex items-center gap-1"><FileText size={11} /> {classAssignments.length}</span>
                      </div>
                      {!isTeacher && teacher && (
                        <span className="text-slate-600">{teacher.name.split(' ')[0]} {teacher.name.split(' ')[1]?.[0]}.</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && <CreateClassroomModal onClose={() => setShowCreate(false)} />}
      {showJoin && <JoinClassroomModal onClose={() => setShowJoin(false)} />}
    </AppShell>
  );
};

export default ClassroomsPage;
