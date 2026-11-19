import { useEffect, useState } from 'react'
import { I18nContext } from './i18n'
import { translations } from '../data/translations'

const LANG_KEY = 'mindbridge_lang'

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY)
      return saved === 'ar' ? 'ar' : 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    try {
      window.localStorage.setItem(LANG_KEY, lang)
    } catch {
      // ignore storage failure
    }
  }, [lang])

  function setLang(next) {
    setLangState(next === 'ar' ? 'ar' : 'en')
  }

  function formatDate(value) {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleString(lang === 'ar' ? 'ar-AE' : 'en-AE')
    } catch {
      return new Date(value).toLocaleString()
    }
  }

  const value = {
    lang,
    setLang,
    isRtl: lang === 'ar',
    t: translations[lang] || translations.en,
    formatDate,
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
