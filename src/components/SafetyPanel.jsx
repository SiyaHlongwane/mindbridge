import { Link } from 'react-router-dom'
import { crisisDetails } from '../data/safety'
import { useAuth } from '../context/auth'
import { useI18n } from '../context/i18n'

export default function SafetyPanel({ inlineWarning = false }) {
  const auth = useAuth()
  const { lang } = useI18n()
  const isAr = lang === 'ar'
  const isSignedIn = Boolean(auth?.session)

  return (
    <aside className="safety-panel" aria-labelledby="safety-title" role="region">
      <h2 id="safety-title">
        {isAr ? 'لست وحدك — الدعم الإنساني المختص متاح الآن' : 'You don’t have to face this alone — human support is here'}
      </h2>
      <p>
        {isAr
          ? 'تستحق إجابتك حول أفكار إيذاء النفس أو الموت اهتماماً ورعاية فورية من مختص مرخص. لا تعتمد على الانتظار الرقمي إذا شعرت بعدم الأمان.'
          : inlineWarning
            ? 'Because you selected thoughts of death or self-harm, we want to share immediate human support options right now. You can pause or continue at your own pace.'
            : 'Your response about thoughts of death or self-harm deserves prompt human care, regardless of your total score. Please connect with trained support or someone you trust now.'}
      </p>
      <ul className="crisis-list">
        {crisisDetails.emergencyNumbers.map(item => (
          <li key={item.label}>
            <strong>
              {isAr ? item.labelAr : item.label}: {item.number}
            </strong>{' '}
            — {isAr ? item.noteAr : item.note}
          </li>
        ))}
      </ul>
      <p className="notice">{isAr ? crisisDetails.fallbackAr : crisisDetails.fallbackEn}</p>
      <p className="muted">{isAr ? crisisDetails.disclaimerAr : crisisDetails.disclaimer}</p>
      <div className="actions">
        {isSignedIn && (
          <Link className="button" to="/referrals?urgent=1">
            {isAr ? 'طلب تصعيد عاجل لمختص (أولوية 24 ساعة)' : 'Request urgent human escalation (24h priority)'}
          </Link>
        )}
        <Link className={isSignedIn ? 'button button-secondary' : 'button'} to="/support">
          {isAr ? 'استكشاف الدعم البشري والعاجل' : 'Explore human & urgent support'}
        </Link>
      </div>
    </aside>
  )
}
