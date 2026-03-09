import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, LogOut, User, History, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'

type HeaderProps = {
  onLoginClick: () => void
}

export function Header({ onLoginClick }: HeaderProps) {
  const { user, profile, signOut } = useAuth()
  const { lang, toggleLang, t } = useLang()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setDropdownOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-gray-900">
          <Search className="w-5 h-5 text-primary" />
          PriceHunter
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
            {t('Home', 'الرئيسية')}
          </Link>
          {user && (
            <Link to="/history" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              {t('History', 'السجل')}
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
          >
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {profile?.full_name || user.email}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" />
                    {t('Profile', 'الملف الشخصي')}
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 md:hidden"
                  >
                    <History className="w-4 h-4" />
                    {t('History', 'السجل')}
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('Sign out', 'تسجيل الخروج')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onLoginClick}
                className="px-4 py-2 text-sm font-medium text-primary hover:bg-blue-50 rounded-full transition-colors"
              >
                {t('Login', 'دخول')}
              </button>
              <button
                onClick={onLoginClick}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
              >
                {t('Register', 'تسجيل')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
