import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import toast from 'react-hot-toast'

type AuthModalProps = {
  onClose: () => void
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { t } = useLang()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) return toast.error(t('Please fill in all fields', 'يرجى ملء جميع الحقول'))
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success(t('Welcome back!', 'مرحباً بعودتك!'))
        onClose()
      } else {
        if (!fullName) return toast.error(t('Please enter your name', 'يرجى إدخال اسمك'))
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            preferred_language: 'en',
          })
        }
        toast.success(t('Account created! Please check your email.', 'تم إنشاء الحساب! تحقق من بريدك الإلكتروني.'))
        onClose()
      }
    } catch (err: any) {
      toast.error(err.message || t('Something went wrong', 'حدث خطأ ما'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fadeIn">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-gray-900">
            {mode === 'login' ? t('Welcome back', 'مرحباً بعودتك') : t('Create account', 'إنشاء حساب')}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            {mode === 'login'
              ? t('Sign in to save your searches', 'سجل دخولك لحفظ عمليات البحث')
              : t('Join PriceHunter for free', 'انضم إلى PriceHunter مجاناً')}
          </p>
        </div>

        <div className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Full name', 'الاسم الكامل')}</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder={t('John Doe', 'محمد أحمد')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Email', 'البريد الإلكتروني')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Password', 'كلمة المرور')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('Please wait...', 'يرجى الانتظار...')}
              </span>
            ) : mode === 'login' ? t('Sign in', 'تسجيل الدخول') : t('Create account', 'إنشاء حساب')}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'login' ? t("Don't have an account?", 'ليس لديك حساب؟') : t('Already have an account?', 'لديك حساب بالفعل؟')}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-primary font-medium hover:underline"
          >
            {mode === 'login' ? t('Register', 'سجل الآن') : t('Sign in', 'تسجيل الدخول')}
          </button>
        </p>
      </div>
    </div>
  )
}
