import { useState } from 'react'
import { User, Globe, Lock, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { CountrySelector } from '../components/CountrySelector'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [preferredCountry, setPreferredCountry] = useState(profile?.preferred_country || '')
  const [preferredLang, setPreferredLang] = useState(profile?.preferred_language || 'en')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, preferred_country: preferredCountry, preferred_language: preferredLang })
      .eq('id', user.id)
    if (error) toast.error(error.message)
    else { toast.success(t('Profile updated!', 'تم تحديث الملف الشخصي!')); await refreshProfile() }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error(t('Password must be at least 6 characters', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'))
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else { toast.success(t('Password changed!', 'تم تغيير كلمة المرور!')); setNewPassword('') }
  }

  const handleDeleteAccount = async () => {
    await signOut()
    navigate('/')
    toast(t('Account deleted', 'تم حذف الحساب'))
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl font-bold text-gray-900">{t('Profile', 'الملف الشخصي')}</h1>
        </div>

        {/* Profile info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> {t('Personal Info', 'المعلومات الشخصية')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('Full name', 'الاسم الكامل')}</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('Email', 'البريد الإلكتروني')}</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('Preferred country', 'الدولة المفضلة')}</label>
              <CountrySelector value={preferredCountry} onChange={setPreferredCountry} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('Preferred language', 'اللغة المفضلة')}</label>
              <select
                value={preferredLang}
                onChange={e => setPreferredLang(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? t('Saving...', 'جاري الحفظ...') : t('Save changes', 'حفظ التغييرات')}
            </button>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" /> {t('Change Password', 'تغيير كلمة المرور')}
          </h2>
          <div className="space-y-4">
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder={t('New password', 'كلمة المرور الجديدة')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              onClick={handleChangePassword}
              className="w-full py-3 border border-primary text-primary font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              {t('Update password', 'تحديث كلمة المرور')}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
          <h2 className="font-semibold text-red-600 mb-4 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> {t('Danger Zone', 'منطقة الخطر')}
          </h2>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors"
            >
              {t('Delete account', 'حذف الحساب')}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">{t('Are you sure? This cannot be undone.', 'هل أنت متأكد؟ لا يمكن التراجع عن هذا.')}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                  {t('Cancel', 'إلغاء')}
                </button>
                <button onClick={handleDeleteAccount} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">
                  {t('Yes, delete', 'نعم، احذف')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
