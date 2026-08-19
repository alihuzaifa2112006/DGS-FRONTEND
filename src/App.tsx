import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Landing from '@/pages/Landing'
import Toaster from '@/components/ui/Toaster'
import { LogoMark } from '@/components/Logo'

const Help = lazy(() => import('@/pages/Help'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const AuthLayout = lazy(() => import('@/pages/auth/AuthLayout'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Signup = lazy(() => import('@/pages/auth/Signup'))
const Forgot = lazy(() => import('@/pages/auth/Forgot'))
const AppLayout = lazy(() => import('@/pages/app/AppLayout'))
const Dashboard = lazy(() => import('@/pages/app/Dashboard'))
const ApiTester = lazy(() => import('@/pages/app/ApiTester'))
const WebsiteScan = lazy(() => import('@/pages/app/WebsiteScan'))
const Reports = lazy(() => import('@/pages/app/Reports'))
const Settings = lazy(() => import('@/pages/app/Settings'))

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])
  return null
}

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900">
      <div className="relative">
        <span className="absolute -inset-4 animate-ping rounded-full bg-brand-500/20 [animation-duration:1.6s]" />
        <LogoMark size={44} className="relative" />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/help" element={<Help />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<Forgot />} />
          </Route>

          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="api-tester" element={<ApiTester />} />
            <Route path="website-scan" element={<WebsiteScan />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}
