import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SkeletonList } from './components/Skeleton'
import Layout from './components/Layout'
import useToast from './hooks/useToast'
import ToastContainer from './components/Toast'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Jobs = lazy(() => import('./pages/Jobs'))
const JobDetail = lazy(() => import('./pages/JobDetail'))
const Clients = lazy(() => import('./pages/Clients'))
const ClientDetail = lazy(() => import('./pages/ClientDetail'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Earnings = lazy(() => import('./pages/Earnings'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Estimates = lazy(() => import('./pages/Estimates'))
const Settings = lazy(() => import('./pages/Settings'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const BookingPage = lazy(() => import('./pages/BookingPage'))

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <SkeletonList />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { toasts, showToast, removeToast } = useToast()

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Suspense fallback={<SkeletonList />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/book/:username" element={<BookingPage />} />

          {/* Onboarding (protected, no layout) */}
          <Route path="/onboarding" element={
            <ProtectedRoute><Onboarding /></ProtectedRoute>
          } />

          {/* Protected routes with Layout */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/jobs" element={
            <ProtectedRoute><Layout><Jobs /></Layout></ProtectedRoute>
          } />
          <Route path="/jobs/:id" element={
            <ProtectedRoute><Layout><JobDetail /></Layout></ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute><Layout><Clients /></Layout></ProtectedRoute>
          } />
          <Route path="/clients/:id" element={
            <ProtectedRoute><Layout><ClientDetail /></Layout></ProtectedRoute>
          } />
          <Route path="/schedule" element={
            <ProtectedRoute><Layout><Schedule /></Layout></ProtectedRoute>
          } />
          <Route path="/earnings" element={
            <ProtectedRoute><Layout><Earnings /></Layout></ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute><Layout><Expenses /></Layout></ProtectedRoute>
          } />
          <Route path="/estimates" element={
            <ProtectedRoute><Layout><Estimates /></Layout></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>
          } />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
