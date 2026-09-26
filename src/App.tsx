import React, { useEffect } from 'react';
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
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Load all shared data from Supabase and populate the Zustand store */
async function loadAllData(userId: string) {
  const set = useStore.getState;
  const [profiles, classrooms, assignments, essays, reviews, notifications] = await Promise.all([
    fetchAllProfiles(),
    fetchAllClassrooms(),
    fetchAllAssignments(),
    fetchAllEssays(),
    fetchAllReviews(),
    fetchNotificationsForUser(userId),
  ]);
  useStore.setState({
    users: profiles,
    classrooms,
    assignments,
    essays,
    reviews,
    notifications,
  });
  void set; // suppress unused warning
}

function App() {
  const { currentUser, setCurrentUser, theme } = useStore();

  // Apply saved theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Listen to Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const u = session.user;
          const meta = u.user_metadata ?? {};
          const profile = {
            id: u.id,
            name: (meta.name as string) || u.email?.split('@')[0] || 'User',
            email: u.email ?? '',
            avatar: (meta.avatar as string) || 'US',
            role: ((meta.role as string) || 'student') as 'teacher' | 'student',
          };
          setCurrentUser(profile);
          await loadAllData(u.id);
        } else {
          // Signed out
          setCurrentUser(null);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [setCurrentUser]);

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
