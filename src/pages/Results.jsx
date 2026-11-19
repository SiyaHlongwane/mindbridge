import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useI18n } from '../context/i18n'
import { getAssessment, listAssessments } from '../services/assessmentService'
import {
  compareAssessments,
  explainCalculation,
  functioningQuestion,
  hasSelfHarmResponse,
  instruments,
  optInSignalsConfig,
  scoreAssessment,
  severityMeanings,
} from '../data/instruments'
import SafetyPanel from '../components/SafetyPanel'
import Button from '../components/Button'

export default function Results() {
  const { id } = useParams()
  const location = useLocation()
  const ephemeralResult = id === 'ephemeral' ? location.state?.ephemeralResult : null
  const { user } = useAuth()
  const { lang, formatDate } = useI18n()
  const isAr = lang === 'ar'
  const [state, setState] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    if (id === 'ephemeral') {
      const score = ephemeralResult ? scoreAssessment(ephemeralResult.instrument, ephemeralResult.answers) : null
      Promise.resolve().then(() => {
        if (active) setState({ id, userId: user.id, row: ephemeralResult || null, score, previous: null })
      })
      return () => {
        active = false
      }
    }
    Promise.all([getAssessment(user.id, id), listAssessments(user.id)])
      .then(([row, history]) => {
        const score = row ? scoreAssessment(row.instrument, row.answers) : null
        const previous = row
          ? history.find(
              item =>
                item.id !== row.id &&
                item.instrument === row.instrument &&
                Date.parse(item.created_at) < Date.parse(row.created_at)
            )
          : null
        if (active) setState({ id, userId: user.id, row, score, previous })
      })
      .catch(error => {
        if (active) setState({ id, userId: user.id, error: error.message || 'Unable to load your result.' })
      })
    return () => {
      active = false
    }
  }, [id, user.id, attempt, ephemeralResult])

  if (!state || state.id !== id || state.userId !== user.id) return <p role="status">Loading your result…</p>
  if (state.error) {
    return (
      <section className="page-intro">
        <h1>Unable to load this result</h1>
        <p className="error" role="alert">{state.error}</p>
        <Button onClick={() => setAttempt(attempt + 1)}>Try again</Button>
      </section>
    )
  }
  if (!state.row) {
    return (
      <section className="page-intro">
        <h1>{id === 'ephemeral' ? 'Session-only result cleared' : 'Result not found'}</h1>
        <p>
          {id === 'ephemeral'
            ? 'Because history retention was turned off, this result was displayed only for that session and was not saved. Take a new check-in or enable history retention in Privacy.'
            : 'This result does not exist or is not available to your account.'}
        </p>
        <div className="actions">
          <Link className="button" to="/assessment">Take an assessment</Link>
          <Link className="button button-secondary" to="/privacy">Privacy settings</Link>
        </div>
      </section>
    )
  }

  const { row, score, previous } = state
  const instrument = instruments[row.instrument]
  const meaning = severityMeanings[score.severity]
  const change = compareAssessments(row, previous, isAr ? 'ar-AE' : 'en-GB')
  const calculationText = explainCalculation(row.instrument, row.answers)
  const lowerBand = ['minimal', 'mild'].includes(score.severity)
  const urgent = hasSelfHarmResponse(row.instrument, row.answers)

  return (
    <section className="page-intro">
      {urgent && <SafetyPanel />}
      <p className="eyebrow">{isAr ? 'نتيجة الفحص المبدئي' : 'YOUR SCREENING RESULT'}</p>
      <h1>
        {isAr ? instrument.nameAr : instrument.name}: {isAr ? instrument.focusAr : instrument.focus}
      </h1>

      <div className="card">
        {row.ephemeral && (
          <p className="notice" role="status">
            <strong>{isAr ? 'نتيجة لهذه الجلسة فقط:' : 'Session-only result (not stored in long-term history):'}</strong>{' '}
            {isAr
              ? 'بناءً على اختيارك في إعدادات الخصوصية، لم يتم حفظ هذا التقييم في السجل.'
              : 'Because "Retain personal assessment history" is off in Privacy, this check-in was not saved to your account.'}
          </p>
        )}
        <p className="result-score">
          {score.total}
          <span> / {instrument.max}</span>
        </p>
        <h2>{score.severity} {row.instrument === 'WHO5' ? 'risk / wellbeing band' : 'symptom range'}</h2>
        <p className="muted">
          {isAr ? 'تاريخ الإكمال:' : 'Completed'} {formatDate(row.created_at)}.
        </p>

        {change && (
          <div className="notice" role="status">
            <strong>{isAr ? 'التغيّر عبر الزمن:' : 'Change over time:'}</strong> {change.summary}
          </div>
        )}

        <div className="meaning-grid">
          <div className="meaning-box">
            <h3>{isAr ? 'ماذا تعني هذه النتيجة؟' : 'What this result means'}</h3>
            <p>{isAr ? meaning.meansAr : meaning.means}</p>
          </div>
          <div className="meaning-box">
            <h3>{isAr ? 'ما لا تعنيه هذه النتيجة' : 'What this result does NOT mean'}</h3>
            <p>{isAr ? meaning.doesNotMeanAr : meaning.doesNotMean}</p>
          </div>
        </div>

        <div className="meaning-box">
          <h3>{isAr ? 'كيفية حساب النتيجة والحدود السريرية' : 'Transparent calculation & limitations'}</h3>
          <p>{calculationText}</p>
          <p className="muted">
            Self-reported screening captures the past 2–4 weeks only and carries natural uncertainty; it never replaces clinical interview or diagnoses mental illness.
          </p>
        </div>

        {Number.isInteger(row.functioning) && (
          <p className="muted">
            <strong>{isAr ? 'التأثير على الأداء اليومي:' : 'Daily functioning impact:'}</strong>{' '}
            {(isAr ? functioningQuestion.optionsAr : functioningQuestion.options)[row.functioning]}
          </p>
        )}

        {Array.isArray(row.opt_in_signals) && row.opt_in_signals.length > 0 && (
          <div>
            <h3>{isAr ? 'الإشارات الاختيارية المسجلة' : 'Opt-in context noted'}</h3>
            <ul>
              {row.opt_in_signals.map(sigId => {
                const match = optInSignalsConfig.find(item => item.id === sigId)
                return <li key={sigId}>{match ? (isAr ? match.labelAr : match.label) : sigId}</li>
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="card next-steps">
        <h2>{isAr ? 'خطوتك التالية (بإشراف بشري)' : 'Your next step (human-in-the-loop)'}</h2>
        {urgent ? (
          <p>
            Because you indicated thoughts of self-harm, please connect with trained human support immediately. Request an urgent priority referral or call Sakina <strong>800-725462</strong> or UAE Ambulance <strong>998</strong>.
          </p>
        ) : lowerBand ? (
          <p>
            Consider self-help resources, community peer support, or a primary-care check-in. You can retake an assessment in 2 weeks to monitor change over time, or connect with tele-mental health at any time.
          </p>
        ) : (
          <p>
            Consider connecting with Abu Dhabi tele-mental health, primary healthcare, or a licensed mental health specialist. A licensed clinician will review options together with you.
          </p>
        )}
        <div className="actions">
          {urgent && (
            <Link className="button" to="/referrals?urgent=1">
              {isAr ? 'طلب تصعيد عاجل لمختص' : 'Request urgent human escalation'}
            </Link>
          )}
          <Link className={urgent ? 'button button-secondary' : 'button'} to="/support">
            {isAr ? 'استكشاف الدعم المتدرج' : 'Explore stepped support options'}
          </Link>
          <Link className="button button-secondary" to="/dashboard">
            {isAr ? 'العودة إلى لوحة المتابعة' : 'Back to dashboard'}
          </Link>
        </div>
      </div>
    </section>
  )
}
