import { useI18n } from '../context/i18n'

export default function CrisisBanner() {
  const { t } = useI18n()
  return (
    <aside className="crisis-banner" aria-label="Urgent support">
      <span>{t.crisis.bannerPrefix}</span>{' '}
      <strong>{t.crisis.sakina}</strong>{' '}
      <span aria-hidden="true">·</span>{' '}
      <strong>{t.crisis.ambulance}</strong>
    </aside>
  )
}
