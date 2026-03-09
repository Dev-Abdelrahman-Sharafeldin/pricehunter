import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LangProvider } from './contexts/LangContext'
import { Header } from './components/Header'
import { AuthModal } from './components/AuthModal'
import { Home } from './pages/Home'
import { History } from './pages/History'
import { Results } from './pages/Results'
import { Profile } from './pages/Profile'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppInner() {
  const [showAuth, setShowAuth] = useState(false)

  return (
    <>
      <Header onLoginClick={() => setShowAuth(true)} />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <Routes>
        <Route path="/" element={<Home onLoginRequired={() => setShowAuth(true)} />} />
        <Route path="/results/:searchId" element={<Results />} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © 2025 PriceHunter — <a href="#" className="hover:text-primary">Privacy Policy</a> · <a href="#" className="hover:text-primary">Terms</a>
      </footer>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <AppInner />
          <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', fontSize: '14px' } }} />
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  )
}
