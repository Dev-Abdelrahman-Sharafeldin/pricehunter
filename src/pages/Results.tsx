import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Share2, Trophy } from 'lucide-react'
import { supabase, Search as SearchType, SearchResult, Country } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { ResultCard } from '../components/ResultCard'
import toast from 'react-hot-toast'

export function Results() {
  const { searchId } = useParams()
  const { lang, t } = useLang()
  const [search, setSearch] = useState<SearchType | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'price_asc' | 'price_desc' | 'site'>('price_asc')

  useEffect(() => {
    supabase.from('countries').select('*').then(({ data }) => { if (data) setCountries(data) })
  }, [])

  useEffect(() => {
    if (!searchId) return
    Promise.all([
      supabase.from('searches').select('*').eq('id', searchId).single(),
      supabase.from('search_results').select('*').eq('search_id', searchId)
    ]).then(([{ data: s }, { data: r }]) => {
      if (s) setSearch(s)
      if (r) setResults(r)
      setLoading(false)
    })
  }, [searchId])

  const getCountryName = (code: string) => {
    const c = countries.find(x => x.code === code)
    return c ? (lang === 'ar' ? c.name_ar : c.name_en) : code
  }

  const getCountryFlag = (code: string) => countries.find(x => x.code === code)?.flag_emoji || ''

  const sortedResults = [...results].sort((a, b) => {
    if (sort === 'price_asc') return (a.price || 0) - (b.price || 0)
    if (sort === 'price_desc') return (b.price || 0) - (a.price || 0)
    return a.site_name.localeCompare(b.site_name)
  })

  const bestResult = sortedResults[0]

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success(t('Link copied!', 'تم نسخ الرابط!'))
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('New Search', 'بحث جديد')}
          </Link>
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors">
            <Share2 className="w-4 h-4" />
            {t('Share', 'مشاركة')}
          </button>
        </div>

        {/* Summary banner */}
        {bestResult && (
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-start gap-3">
              <Trophy className="w-8 h-8 shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">{t('Best Deal Found', 'أفضل عرض')}</p>
                <p className="font-bold text-lg leading-snug">{bestResult.product_name}</p>
                <p className="text-blue-100 text-sm mt-1">
                  {bestResult.price?.toLocaleString()} {bestResult.currency} {t('on', 'على')} {bestResult.site_name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search info */}
        {search && (
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">"{search.product_query}"</p>
              <p className="text-sm text-gray-400 mt-0.5">
                {getCountryFlag(search.country_code)} {getCountryName(search.country_code)} · {new Date(search.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className="text-sm text-gray-400">{results.length} {t('results', 'نتيجة')}</span>
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-500">{t('Sort by', 'ترتيب حسب')}</p>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as any)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none bg-white"
          >
            <option value="price_asc">{t('Price: Low to High', 'السعر: الأقل أولاً')}</option>
            <option value="price_desc">{t('Price: High to Low', 'السعر: الأعلى أولاً')}</option>
            <option value="site">{t('Site Name', 'اسم الموقع')}</option>
          </select>
        </div>

        {/* Results grid */}
        {sortedResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedResults.map(r => <ResultCard key={r.id} result={r} isBest={r.id === bestResult?.id} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p>{t('No results found for this search', 'لم يتم العثور على نتائج لهذا البحث')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
