import { useState, useEffect, useRef } from 'react'
import { Search, ArrowUpDown, SortAsc, SortDesc } from 'lucide-react'
import { supabase, Search as SearchType, SearchResult, Country } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { CountrySelector } from '../components/CountrySelector'
import { ResultCard } from '../components/ResultCard'
import toast from 'react-hot-toast'

type SortOption = 'price_asc' | 'price_desc' | 'site'

const LOADING_MESSAGES_EN = [
  'Connecting to stores...', 'Searching for products...', 'Comparing prices...',
  'Analyzing results...', 'Almost done...', 'Finalizing best deals...'
]
const LOADING_MESSAGES_AR = [
  'الاتصال بالمتاجر...', 'البحث عن المنتجات...', 'مقارنة الأسعار...',
  'تحليل النتائج...', 'اكتمل تقريبًا...', 'تحديد أفضل العروض...'
]

type HomeProps = {
  onLoginRequired: () => void
}

export function Home({ onLoginRequired }: HomeProps) {
  const { user } = useAuth()
  const { lang, t } = useLang()
  const [query, setQuery] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [compareCountryCode, setCompareCountryCode] = useState('')
  const [searching, setSearching] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [results, setResults] = useState<SearchResult[]>([])
  const [compareResults, setCompareResults] = useState<SearchResult[]>([])
  const [sort, setSort] = useState<SortOption>('price_asc')
  const [recentSearches, setRecentSearches] = useState<SearchType[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const subscriptionRef = useRef<any>(null)
  const timerRef = useRef<any>(null)
  const msgIntervalRef = useRef<any>(null)

  useEffect(() => {
    supabase.from('countries').select('*').eq('active', true).then(({ data }) => {
      if (data) setCountries(data)
    })
  }, [])

  useEffect(() => {
    if (user) {
      supabase
        .from('searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => { if (data) setRecentSearches(data) })
    }
  }, [user, hasSearched])

  const handleSearch = async () => {
    if (!query.trim()) return toast.error(t('Please enter a product name', 'يرجى إدخال اسم المنتج'))
    if (!countryCode) return toast.error(t('Please select a country', 'يرجى اختيار الدولة'))
    if (compareMode && !compareCountryCode) return toast.error(t('Please select the second country', 'يرجى اختيار الدولة الثانية'))
    if (!user) { onLoginRequired(); return }

    setSearching(true)
    setResults([])
    setCompareResults([])
    setHasSearched(true)
    setLoadingMsg(0)

    msgIntervalRef.current = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES_EN.length)
    }, 3000)

    try {
      const { data: searchRow, error } = await supabase
        .from('searches')
        .insert({
          user_id: user.id,
          product_query: query.trim(),
          country_code: countryCode,
          compare_country_code: compareMode ? compareCountryCode : null,
          status: 'pending'
        })
        .select()
        .single()

      if (error || !searchRow) throw new Error('Failed to create search')

      // Call edge function
      await supabase.functions.invoke('trigger-search', {
        body: {
          search_id: searchRow.id,
          product: query.trim(),
          country_code: countryCode,
          compare_country_code: compareMode ? compareCountryCode : null,
          user_id: user.id
        }
      })

      // Subscribe to realtime
      subscriptionRef.current = supabase
        .channel(`search-${searchRow.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'searches',
          filter: `id=eq.${searchRow.id}`
        }, async (payload) => {
          const updated = payload.new as SearchType
          if (updated.status === 'completed' || updated.status === 'failed') {
            clearInterval(msgIntervalRef.current)
            clearTimeout(timerRef.current)
            subscriptionRef.current?.unsubscribe()

            if (updated.status === 'completed') {
              const { data: res } = await supabase
                .from('search_results')
                .select('*')
                .eq('search_id', searchRow.id)
                .eq('country_code', countryCode)

              if (res) setResults(res)

              if (compareMode && compareCountryCode) {
                const { data: res2 } = await supabase
                  .from('search_results')
                  .select('*')
                  .eq('search_id', searchRow.id)
                  .eq('country_code', compareCountryCode)
                if (res2) setCompareResults(res2)
              }

              if (!res?.length) toast(t('No results found for this product', 'لم يتم العثور على نتائج لهذا المنتج'))
            } else {
              toast.error(t('Search failed. Please try again.', 'فشل البحث. حاول مرة أخرى.'))
            }
            setSearching(false)
          }
        })
        .subscribe()

      // 90 second timeout
      timerRef.current = setTimeout(() => {
        clearInterval(msgIntervalRef.current)
        subscriptionRef.current?.unsubscribe()
        setSearching(false)
        toast.error(t('Search timed out. Please try again.', 'انتهت مهلة البحث. حاول مرة أخرى.'))
      }, 90000)

    } catch (err: any) {
      clearInterval(msgIntervalRef.current)
      setSearching(false)
      toast.error(err.message || t('Something went wrong', 'حدث خطأ ما'))
    }
  }

  const sortResults = (arr: SearchResult[]) => {
    return [...arr].sort((a, b) => {
      if (sort === 'price_asc') return (a.price || 0) - (b.price || 0)
      if (sort === 'price_desc') return (b.price || 0) - (a.price || 0)
      return a.site_name.localeCompare(b.site_name)
    })
  }

  const getCountryName = (code: string) => {
    const c = countries.find(x => x.code === code)
    if (!c) return code
    return lang === 'ar' ? c.name_ar : c.name_en
  }

  const getCountryFlag = (code: string) => countries.find(x => x.code === code)?.flag_emoji || ''

  const sortedResults = sortResults(results)
  const sortedCompareResults = sortResults(compareResults)
  const bestPrice = sortedResults[0]
  const bestComparePrice = sortedCompareResults[0]

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
            PriceHunter
          </h1>
          <p className="text-primary font-semibold text-lg">
            {t("Compare prices across the world's top stores in seconds", 'قارن الأسعار عبر أكبر المتاجر في العالم خلال ثوانٍ')}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {t('Find the best deals on any product from global e-commerce platforms', 'اعثر على أفضل العروض من منصات التسوق الإلكتروني العالمية')}
          </p>
        </div>

        {/* Search box */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={t('Search for any product...', 'ابحث عن أي منتج...')}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-gray-800"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {searching ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {t('Search', 'بحث')}
            </button>
          </div>

          <CountrySelector value={countryCode} onChange={setCountryCode} />

          {/* Compare toggle */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className={`text-sm font-medium ${!compareMode ? 'text-primary' : 'text-gray-400'}`}>
              {t('Single Country', 'دولة واحدة')}
            </span>
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${compareMode ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${compareMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${compareMode ? 'text-primary' : 'text-gray-400'}`}>
              {t('Compare Two Countries', 'مقارنة بين دولتين')}
            </span>
          </div>

          {compareMode && (
            <div className="mt-4">
              <CountrySelector
                value={compareCountryCode}
                onChange={setCompareCountryCode}
                placeholder={t('Select second country', 'اختر الدولة الثانية')}
              />
            </div>
          )}
        </div>

        {/* Recent searches */}
        {user && recentSearches.length > 0 && !hasSearched && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('Recent searches', 'عمليات البحث الأخيرة')}</p>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setQuery(s.product_query); setCountryCode(s.country_code) }}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  {s.product_query} · {getCountryFlag(s.country_code)} {getCountryName(s.country_code)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {searching && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
            <p className="text-gray-600 font-medium animate-pulse">
              {lang === 'ar' ? LOADING_MESSAGES_AR[loadingMsg] : LOADING_MESSAGES_EN[loadingMsg]}
            </p>
            <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-[loading_3s_ease-in-out_infinite]" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* Results */}
        {!searching && (sortedResults.length > 0 || sortedCompareResults.length > 0) && (
          <div>
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-600">
                {sortedResults.length + sortedCompareResults.length} {t('results found', 'نتيجة')}
              </p>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortOption)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="price_asc">{t('Price: Low to High', 'السعر: الأقل أولاً')}</option>
                  <option value="price_desc">{t('Price: High to Low', 'السعر: الأعلى أولاً')}</option>
                  <option value="site">{t('Site Name', 'اسم الموقع')}</option>
                </select>
              </div>
            </div>

            {compareMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-xl">{getCountryFlag(countryCode)}</span>
                    {getCountryName(countryCode)}
                  </h3>
                  <div className="space-y-3">
                    {sortedResults.map(r => <ResultCard key={r.id} result={r} isBest={r.id === bestPrice?.id} />)}
                    {sortedResults.length === 0 && <p className="text-gray-400 text-sm text-center py-8">{t('No results', 'لا توجد نتائج')}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-xl">{getCountryFlag(compareCountryCode)}</span>
                    {getCountryName(compareCountryCode)}
                  </h3>
                  <div className="space-y-3">
                    {sortedCompareResults.map(r => <ResultCard key={r.id} result={r} isBest={r.id === bestComparePrice?.id} />)}
                    {sortedCompareResults.length === 0 && <p className="text-gray-400 text-sm text-center py-8">{t('No results', 'لا توجد نتائج')}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedResults.map(r => <ResultCard key={r.id} result={r} isBest={r.id === bestPrice?.id} />)}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!searching && hasSearched && results.length === 0 && compareResults.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{t('No results found', 'لم يتم العثور على نتائج')}</p>
            <p className="text-sm mt-1">{t('Try a different product or country', 'جرب منتجاً أو دولة أخرى')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
