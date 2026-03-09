import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { supabase, Country } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'

type CountrySelectorProps = {
  value: string
  onChange: (code: string) => void
  placeholder?: string
}

export function CountrySelector({ value, onChange, placeholder }: CountrySelectorProps) {
  const { lang, t } = useLang()
  const [countries, setCountries] = useState<Country[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('countries')
      .select('*')
      .eq('active', true)
      .order('name_en')
      .then(({ data }) => {
        if (data) setCountries(data)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = countries.find(c => c.code === value)
  const filtered = countries.filter(c =>
    c.name_en.toLowerCase().includes(search.toLowerCase()) ||
    c.name_ar.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl bg-white hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <span className="flex items-center gap-2 text-sm">
          {loading ? (
            <span className="text-gray-400">{t('Loading...', 'جاري التحميل...')}</span>
          ) : selected ? (
            <>
              <span className="text-lg">{selected.flag_emoji}</span>
              <span className="font-medium text-gray-800">{lang === 'ar' ? selected.name_ar : selected.name_en}</span>
              <span className="text-gray-400 text-xs">({selected.currency})</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder || t('Select country', 'اختر الدولة')}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('Search countries...', 'ابحث عن دولة...')}
                className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">{t('No countries found', 'لا توجد دول')}</div>
            ) : (
              filtered.map(country => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => { onChange(country.code); setOpen(false); setSearch('') }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors text-left ${value === country.code ? 'bg-blue-50 text-primary' : 'text-gray-700'}`}
                >
                  <span className="text-lg">{country.flag_emoji}</span>
                  <span className="font-medium">{lang === 'ar' ? country.name_ar : country.name_en}</span>
                  <span className="text-gray-400 text-xs ml-auto">{country.currency}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
