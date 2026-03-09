import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Lang = 'en' | 'ar'

type LangContextType = {
  lang: Lang
  toggleLang: () => void
  t: (en: string, ar: string) => string
  isRTL: boolean
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  toggleLang: () => {},
  t: (en) => en,
  isRTL: false,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('ph_lang') as Lang) || 'en'
  })

  useEffect(() => {
    localStorage.setItem('ph_lang', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  const toggleLang = () => setLang(l => l === 'en' ? 'ar' : 'en')
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en
  const isRTL = lang === 'ar'

  return (
    <LangContext.Provider value={{ lang, toggleLang, t, isRTL }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
