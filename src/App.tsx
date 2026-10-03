import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';
import {
  fetchAllProfiles,
  fetchAllClassrooms,
  fetchAllAssignments,
  fetchAllEssays,
  fetchAllReviews,
  fetchNotificationsForUser,
} from './lib/db';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClassroomsPage from './pages/ClassroomsPage';
import ClassroomPage from './pages/ClassroomPage';
import AssignmentPage from './pages/AssignmentPage';
import ReviewPage from './pages/ReviewPage';
import ResultsPage from './pages/ResultsPage';
import EssaysPage from './pages/EssaysPage';
import ReviewsPage from './pages/ReviewsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, authReady } = useStore();
  if (!authReady) return <div role="status">Загрузка…</div>;
  if (!currentUser) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Load all shared data from Supabase and populate the Zustand store */
async function loadAllData(userId: string, isCurrent: () => boolean) {
  const [profiles, classrooms, assignments, essays, reviews, notifications] = await Promise.all([
    fetchAllProfiles(),
    fetchAllClassrooms(),
    fetchAllAssignments(),
    fetchAllEssays(),
    fetchAllReviews(),
    fetchNotificationsForUser(userId),
  ]);
  if (!isCurrent()) return;
  const profile = profiles.find((p) => p.id === userId);
  if (!profile) throw new Error('Не удалось загрузить профиль. Повторите загрузку страницы.');
  useStore.setState({
    currentUser: profile,
    authReady: true,
    users: profiles,
    classrooms,
    assignments,
    essays,
    reviews,
    notifications,
  });
}

function App() {
  const { currentUser, authReady, theme } = useStore();
  const [authError, setAuthError] = useState('');

  // Apply saved theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Listen to Supabase auth state changes
  useEffect(() => {
    let generation = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user.id === useStore.getState().currentUser?.id &&
          (_event === 'TOKEN_REFRESHED' || _event === 'SIGNED_IN')) return;
        const requestGeneration = ++generation;
        setAuthError('');
        useStore.setState({ currentUser: null, authReady: !session?.user, users: [],
          classrooms: [], assignments: [], essays: [], reviews: [], notifications: [],
          activeReview: null, toasts: [], xp: 0, streak: 0, badges: [],
          reviewerRank: 'novice', lastActivityDate: null });
        if (session?.user) {
          // Run SDK queries after the auth callback releases its session lock.
          setTimeout(() => {
            if (generation !== requestGeneration) return;
            void loadAllData(session.user.id, () => generation === requestGeneration).catch((error: Error) => {
              if (generation === requestGeneration) setAuthError(error.message);
            });
          }, 0);
        }
      }
    );
    return () => { ++generation; subscription.unsubscribe(); };
  }, []);

  if (authError) return <div role="alert">{authError} <button onClick={() => window.location.reload()}>Повторить</button></div>;
  if (!authReady) return <div role="status">Загрузка…</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />

        <Route path="/classrooms" element={
          <ProtectedRoute><ClassroomsPage /></ProtectedRoute>
        } />

        <Route path="/classrooms/:classroomId" element={
          <ProtectedRoute><ClassroomPage /></ProtectedRoute>
        } />

        <Route path="/assignments/:assignmentId" element={
          <ProtectedRoute><AssignmentPage /></ProtectedRoute>
        } />

        <Route path="/review/:essayId" element={
          <ProtectedRoute><ReviewPage /></ProtectedRoute>
        } />

        <Route path="/essays" element={
          <ProtectedRoute><EssaysPage /></ProtectedRoute>
        } />
        <Route path="/reviews" element={
          <ProtectedRoute><ReviewsPage /></ProtectedRoute>
        } />
        <Route path="/assignments" element={
          <ProtectedRoute><AssignmentsPage /></ProtectedRoute>
        } />
        <Route path="/results" element={
          <ProtectedRoute><ResultsPage /></ProtectedRoute>
        } />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
