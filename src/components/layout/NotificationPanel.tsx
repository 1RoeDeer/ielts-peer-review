import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import type { Notification, NotificationType } from '../../types';
import {
  X, Bell, CheckCheck, Trash2, FileText, Star,
  BookOpen, Clock, Users, ChevronRight, Sparkles, ShieldAlert, GraduationCap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_META: Record<NotificationType, { icon: React.FC<{ size: number }>, color: string, bg: string, border: string }> = {
  new_topic:          { icon: Sparkles,    color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.28)' },
  new_assignment:     { icon: FileText,    color: '#2563eb', bg: 'rgba(37,99,235,0.10)',  border: 'rgba(37,99,235,0.22)' },
  essay_reviewed:    { icon: Star,        color: '#16a34a', bg: 'rgba(22,163,74,0.10)',  border: 'rgba(22,163,74,0.22)' },
  review_received:   { icon: Star,        color: '#16a34a', bg: 'rgba(22,163,74,0.10)',  border: 'rgba(22,163,74,0.22)' },
  deadline_reminder: { icon: Clock,       color: '#b45309', bg: 'rgba(161,98,7,0.10)',   border: 'rgba(161,98,7,0.22)' },
  new_student_joined:{ icon: Users,       color: '#0891b2', bg: 'rgba(8,145,178,0.10)',  border: 'rgba(8,145,178,0.22)' },
  review_submitted:  { icon: BookOpen,    color: '#b45309', bg: 'rgba(161,98,7,0.10)',   border: 'rgba(161,98,7,0.22)' },
  grade_edited_by_teacher: { icon: GraduationCap, color: '#9333ea', bg: 'rgba(147,51,234,0.12)', border: 'rgba(147,51,234,0.28)' },
  system_security:   { icon: ShieldAlert, color: '#dc2626', bg: 'rgba(220,38,38,0.12)',  border: 'rgba(220,38,38,0.28)' },
};

interface NotifItemProps {
  notif: Notification;
  onClose: () => void;
}

const NotifItem: React.FC<NotifItemProps> = ({ notif, onClose }) => {
  const { markNotificationRead, clearNotification } = useStore();
  const navigate = useNavigate();
  const meta = TYPE_META[notif.type] || TYPE_META.new_assignment;
  const IconComp = meta.icon;

  const handleClick = () => {
    markNotificationRead(notif.id);
    if (notif.assignmentId) navigate(`/assignments/${notif.assignmentId}`);
    else if (notif.essayId) navigate(`/review/${notif.essayId}`);
    else if (notif.classroomId) navigate(`/classrooms/${notif.classroomId}`);
    onClose();
  };

  return (
    <div
      className={`group relative flex gap-3 px-4 py-3.5 cursor-pointer transition-all ${!notif.read ? 'notif-unread' : ''}`}
      style={{
        background: notif.read ? 'transparent' : meta.bg,
        borderLeft: `3px solid ${notif.read ? 'transparent' : meta.color}`,
      }}
      onMouseEnter={(e) => { if (notif.read) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = notif.read ? 'transparent' : meta.bg; }}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
      >
        <IconComp size={14} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {notif.title}
          </p>
          {!notif.read && (
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: meta.color }} />
          )}
        </div>
        <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {notif.body}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(notif.createdAt)}</span>
          {notif.assignmentId || notif.classroomId || notif.essayId ? (
            <span
              className="flex items-center gap-0.5 text-xs font-medium"
              style={{ color: meta.color }}
            >
              View <ChevronRight size={11} />
            </span>
          ) : null}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); clearNotification(notif.id); }}
        className="absolute right-3 top-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity btn-ghost"
        style={{ padding: '3px' }}
        title="Dismiss"
      >
        <X size={12} style={{ color: 'var(--text-muted)' }} />
      </button>
    </div>
  );
};

const NotificationPanel: React.FC = () => {
  const {
    currentUser, notifications,
    markAllNotificationsRead,
    notifPanelOpen, setNotifPanelOpen,
    simulateTeacherTopicNotification,
  } = useStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'topics' | 'reviews'>('all');

  const myNotifs = notifications
    .filter((n) => n.recipientId === currentUser?.id || n.recipientId === 'all')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = myNotifs.filter((n) => !n.read).length;

  const filteredNotifs = myNotifs.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'topics') return n.type === 'new_topic' || n.type === 'new_assignment';
    if (filter === 'reviews') return n.type === 'essay_reviewed' || n.type === 'review_received' || n.type === 'review_submitted';
    return true;
  });

  // Close on outside click
  useEffect(() => {
    if (!notifPanelOpen) return;
    const handleClick = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifPanelOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [notifPanelOpen, setNotifPanelOpen]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setNotifPanelOpen(!notifPanelOpen)}
        className="btn-ghost relative"
        style={{ padding: '7px', borderRadius: '8px' }}
        title="Notifications"
      >
        <Bell size={16} style={{ color: 'var(--text-secondary)' }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[17px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold animate-scale-in"
            style={{
              background: 'var(--accent)',
              color: 'var(--text-inverse)',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel dropdown */}
      {notifPanelOpen && (
        <div
          className="notification-popover fixed left-3 right-3 top-16 md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-96 rounded-xl overflow-hidden animate-scale-in z-50"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow-xl)',
            maxHeight: 'min(560px, calc(100dvh - 100px))',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            className="flex flex-wrap gap-2 items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: 'var(--text-primary)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--text-inverse)',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="btn-ghost text-xs flex items-center gap-1"
                  style={{ padding: '4px 8px' }}
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
              <button aria-label="Закрыть уведомления" onClick={() => setNotifPanelOpen(false)} className="btn-ghost" style={{ padding: '5px' }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Quick Simulation Banner */}
          <div
            className="px-3 py-2 flex items-center justify-between gap-2 flex-shrink-0"
            style={{
              background: 'var(--bg-card-2)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Simulate real-time alerts:
            </span>
            <button
              onClick={simulateTeacherTopicNotification}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all"
              style={{
                background: 'var(--accent)',
                color: 'var(--text-inverse)',
                boxShadow: 'var(--shadow-sm)',
              }}
              title="Click to trigger: Teacher uploaded a new topic"
            >
              <Sparkles size={12} />
              + Teacher Topic Alert
            </button>
          </div>

          {/* Filter Tabs */}
          <div
            className="flex items-center px-3 py-1.5 gap-1 flex-shrink-0 overflow-x-auto text-xs"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
          >
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'topics', label: 'Topics & Tasks' },
              { id: 'reviews', label: 'Reviews' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap ${
                  filter === tab.id
                    ? 'font-bold'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
                style={{
                  background: filter === tab.id ? 'var(--bg-active)' : 'transparent',
                  color: filter === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: filter === tab.id ? '1px solid var(--border)' : '1px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {filteredNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)' }}
                >
                  <Bell size={20} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications in this category'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Use the simulation button above to generate a test topic alert!
                </p>
              </div>
            ) : (
              <div>
                {/* Unread items */}
                {filteredNotifs.filter((n) => !n.read).length > 0 && (
                  <>
                    <div
                      className="px-4 py-1.5 section-label sticky top-0 text-[10px]"
                      style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
                    >
                      New / Unread
                    </div>
                    {filteredNotifs.filter((n) => !n.read).map((n) => (
                      <React.Fragment key={n.id}>
                        <NotifItem notif={n} onClose={() => setNotifPanelOpen(false)} />
                        <div style={{ borderBottom: '1px solid var(--border)' }} />
                      </React.Fragment>
                    ))}
                  </>
                )}

                {/* Earlier items */}
                {filteredNotifs.filter((n) => n.read).length > 0 && (
                  <>
                    <div
                      className="px-4 py-1.5 section-label sticky top-0 text-[10px]"
                      style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
                    >
                      Earlier
                    </div>
                    {filteredNotifs.filter((n) => n.read).map((n) => (
                      <React.Fragment key={n.id}>
                        <NotifItem notif={n} onClose={() => setNotifPanelOpen(false)} />
                        <div style={{ borderBottom: '1px solid var(--border)' }} />
                      </React.Fragment>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {myNotifs.length > 0 && (
            <div
              className="px-4 py-2.5 flex items-center justify-between text-xs flex-shrink-0"
              style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <span className="flex items-center">
                <Trash2 size={11} className="mr-1.5" />
                Auto-cleared after 30 days
              </span>
              <span className="font-mono text-[11px]">
                {myNotifs.length} total
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
