import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ExternalLink, Search } from 'lucide-react'
import { supabase, Search as SearchType, Country } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'

export function History() {
  const { user } = useAuth()
  const { lang, t } = useLang()
  const [searches, setSearches] = useState<SearchType[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [resultCounts, setResultCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    supabase.from('countries').select('*').then(({ data }) => { if (data) setCountries(data) })
  }, [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        if (data) {
          setSearches(data)
          const counts: Record<string, number> = {}
          for (const s of data) {
            const { count } = await supabase
              .from('search_results')
              .select('*', { count: 'exact', head: true })
              .eq('search_id', s.id)
            counts[s.id] = count || 0
          }
          setResultCounts(counts)
        }
        setLoading(false)
      })
  }, [user])

  const getCountryName = (code: string) => {
    const c = countries.find(x => x.code === code)
    if (!c) return code
    return lang === 'ar' ? c.name_ar : c.name_en
  }

  const getCountryFlag = (code: string) => countries.find(x => x.code === code)?.flag_emoji || ''

  const statusColor = (status: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-700'
    if (status === 'failed') return 'bg-red-100 text-red-700'
    if (status === 'processing') return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-600'
  }

  const statusLabel = (status: string) => {
    if (status === 'completed') return t('Completed', 'مكتمل')
    if (status === 'failed') return t('Failed', 'فشل')
    if (status === 'processing') return t('Processing', 'جاري المعالجة')
    return t('Pending', 'قيد الانتظار')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl font-bold text-gray-900">{t('Search History', 'سجل البحث')}</h1>
        </div>

        {searches.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{t('No searches yet', 'لا توجد عمليات بحث بعد')}</p>
            <p className="text-sm mt-1">{t('Start searching for a product!', 'ابدأ البحث عن منتج!')}</p>
            <Link to="/" className="mt-4 inline-block px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors">
              {t('Search now', 'ابحث الآن')}
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('Product', 'المنتج')}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">{t('Country', 'الدولة')}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">{t('Date', 'التاريخ')}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">{t('Results', 'النتائج')}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('Status', 'الحالة')}</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {searches.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800 text-sm">{s.product_query}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        {getCountryFlag(s.country_code)} {getCountryName(s.country_code)}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-400">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-600">{resultCounts[s.id] ?? '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor(s.status)}`}>
                        {statusLabel(s.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/results/${s.id}`}
                        className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
                      >
                        {t('View', 'عرض')} <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
