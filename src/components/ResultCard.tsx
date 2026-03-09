import { ExternalLink, Trophy } from 'lucide-react'
import { SearchResult } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'

type ResultCardProps = {
  result: SearchResult
  isBest: boolean
}

export function ResultCard({ result, isBest }: ResultCardProps) {
  const { t } = useLang()

  return (
    <div className={`relative bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 ${isBest ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-100'}`}>
      {isBest && (
        <div className="absolute -top-3 left-4 flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          <Trophy className="w-3 h-3" />
          {t('Best Price', 'أفضل سعر')}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">{result.site_name}</p>
          <h3 className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{result.product_name}</h3>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-gray-900">
            {result.price?.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">{result.currency}</p>
        </div>
      </div>

      <a
        href={result.product_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          result.product_url
            ? 'bg-primary text-white hover:bg-primary-dark'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
        }`}
      >
        {t('View Product', 'عرض المنتج')}
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}
