import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useI18n } from '../context/i18n'
import {
  functioningQuestion,
  instrumentNotice,
  instrumentNoticeAr,
  instruments,
  optInSignalsConfig,
} from '../data/instruments'
import { saveAssessment } from '../services/assessmentService'
import Button from '../components/Button'
import SafetyPanel from '../components/SafetyPanel'

const DRAFT_PREFIX = 'mindbridge_assessment_draft_'

export default function Assessment() {
  const { user, consents } = useAuth()
  const { lang } = useI18n()
  const isAr = lang === 'ar'
  const draftKey = `${DRAFT_PREFIX}${user.id}`
  const retainHistory = consents.retain_history !== false

  const [savedDraft, setSavedDraft] = useState(() => {
    try {
      const raw = window.localStorage.getItem(draftKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const [instrumentId, setInstrumentId] = useState(null)
  const [answers, setAnswers] = useState([])
  const [functioning, setFunctioning] = useState(null)
  const [optInSignals, setOptInSignals] = useState([])
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draftMsg, setDraftMsg] = useState('')
  const question = useRef(null)
  const navigate = useNavigate()

  const instrument = instruments[instrumentId]
  const totalSteps = instrument ? instrument.items.length + 1 : 0
  const isContextStep = instrument && step === instrument.items.length
  const showImmediateSafety = instrumentId === 'PHQ9' && answers[8] > 0

  useEffect(() => {
    question.current?.focus()
  }, [step, instrumentId])

  function choose(id) {
    setInstrumentId(id)
    setAnswers(Array(instruments[id].items.length).fill(null))
    setFunctioning(null)
    setOptInSignals([])
    setStep(0)
    setError('')
    setDraftMsg('')
  }

  function resumeDraft() {
    if (!savedDraft || !instruments[savedDraft.instrumentId]) return
    setInstrumentId(savedDraft.instrumentId)
    setAnswers(savedDraft.answers || Array(instruments[savedDraft.instrumentId].items.length).fill(null))
    setFunctioning(savedDraft.functioning ?? null)
    setOptInSignals(savedDraft.optInSignals || [])
    setStep(savedDraft.step || 0)
    setError('')
    setDraftMsg('')
  }

  function saveForLater() {
    if (!instrumentId) return
    const payload = { instrumentId, answers, functioning, optInSignals, step, savedAt: new Date().toISOString() }
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(payload))
      setSavedDraft(payload)
      setDraftMsg(isAr ? 'تم حفظ تقدمك محلياً. يمكنك المتابعة في أي وقت.' : 'Progress saved locally. You can pause and resume whenever you are ready.')
    } catch {
      setError('Unable to save draft locally.')
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(draftKey)
    } catch {
      // ignore
    }
    setSavedDraft(null)
  }

  function toggleSignal(signalId) {
    setOptInSignals(prev => (prev.includes(signalId) ? prev.filter(id => id !== signalId) : [...prev, signalId]))
  }

  async function next(event) {
    event.preventDefault()
    if (!isContextStep && answers[step] === null) {
      return setError(isAr ? 'يرجى اختيار إجابة قبل المتابعة.' : 'Please choose an answer before continuing.')
    }
    setError('')
    if (step < totalSteps - 1) return setStep(step + 1)

    setBusy(true)
    try {
      const saved = await saveAssessment(user.id, instrumentId, answers, {
        functioning,
        optInSignals,
        retainHistory,
      })
      clearDraft()
      navigate(`/results/${saved.id}`, saved.ephemeral ? { state: { ephemeralResult: saved } } : undefined)
    } catch (err) {
      setError(err.message || 'Unable to save your assessment. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const itemsList = instrument ? (isAr && instrument.itemsAr ? instrument.itemsAr : instrument.items) : []
  const optionsList = instrument ? (isAr && instrument.optionsAr ? instrument.optionsAr : instrument.options) : []
  const stemText = instrument ? (isAr && instrument.stemAr ? instrument.stemAr : instrument.stem) : ''

  return (
    <section className="page-intro">
      <p className="eyebrow">{isAr ? 'لحظة للاطمئنان على صحتك' : 'A MOMENT TO CHECK IN'}</p>
      <h1>{isAr ? 'التقييمات النفسية المعتمدة' : 'Validated wellbeing assessments'}</h1>
      <p>
        {isAr
          ? 'المشاركة طوعية تماماً. تعكس هذه الأدوات تجربتك مؤخراً ولا تُعد تشخيصاً طبياً. يمكنك الحفظ والمتابعة لاحقاً في أي وقت.'
          : 'Participation is voluntary. These validated instruments help recognise mood, anxiety, stress, and general wellbeing changes over time; they do not provide a diagnosis.'}
      </p>

      {!retainHistory && (
        <p className="notice" role="status">
          {isAr
            ? 'خيار حفظ السجل متوقف حالياً في الخصوصية: ستظهر نتيجتك لهذه الجلسة فقط ولن تُحفظ في سجلك طويل الأمد.'
            : 'History retention is currently Off in Privacy: your result will be calculated for this session only and will not be saved to long-term history.'}
        </p>
      )}

      {showImmediateSafety && <SafetyPanel inlineWarning />}

      {!instrument ? (
        <>
          {savedDraft && instruments[savedDraft.instrumentId] && (
            <div className="notice dashboard-section" role="status">
              <strong>
                {isAr ? 'لديك تقييم محفوظ غير مكتمل:' : 'Saved draft available:'}{' '}
                {isAr ? instruments[savedDraft.instrumentId].nameAr : instruments[savedDraft.instrumentId].name}
              </strong>
              <div className="actions">
                <Button onClick={resumeDraft}>{isAr ? 'استئناف التقييم' : 'Resume saved assessment'}</Button>
                <Button className="button-secondary" onClick={clearDraft}>
                  {isAr ? 'تجاهل المسودة' : 'Discard draft'}
                </Button>
              </div>
            </div>
          )}
          <div className="assessment-choices">
            {Object.entries(instruments).map(([id, tool]) => (
              <article className="card" key={id}>
                <h2>
                  {isAr ? tool.nameAr : tool.name}: {isAr ? tool.focusAr : tool.focus}
                </h2>
                <p>
                  {tool.items.length} {isAr ? 'أسئلة معتمدة + فحص اختياري للأداء اليومي.' : 'validated questions + optional daily-functioning & context check.'}
                </p>
                <Button onClick={() => choose(id)}>
                  {isAr ? `ابدأ ${tool.name}` : `Start ${tool.name}`}
                </Button>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="card">
          <p role="status">
            {isAr ? instrument.nameAr : instrument.name} · {isAr ? `الخطوة ${step + 1} من ${totalSteps}` : `Step ${step + 1} of ${totalSteps}`}
          </p>
          <progress aria-label="Assessment progress" value={step + 1} max={totalSteps} />
          <form onSubmit={next}>
            {!isContextStep ? (
              <>
                <p>{stemText}</p>
                <fieldset key={`${instrumentId}-${step}`} disabled={busy} className="question-group">
                  <legend ref={question} tabIndex={-1}>
                    {step + 1}. {itemsList[step]}
                  </legend>
                  {optionsList.map((label, value) => (
                    <label className="radio-option" key={value}>
                      <input
                        type="radio"
                        name="answer"
                        value={value}
                        required
                        checked={answers[step] === value}
                        onChange={() =>
                          setAnswers(previous => previous.map((answer, index) => (index === step ? value : answer)))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
              </>
            ) : (
              <div className="question-group">
                <h2 ref={question} tabIndex={-1}>
                  {isAr ? 'سياق اختياري والأداء اليومي' : 'Optional context & daily functioning'}
                </h2>
                <p className="muted">
                  {isAr
                    ? 'هذه الإشارات اختيارية تماماً ولا تُستخدم للمراقبة الخفية، وتُشارك فقط بموافقتك.'
                    : 'Optional signals are never used for covert monitoring and are shared only if you choose to share context during a referral.'}
                </p>

                <fieldset disabled={busy} className="question-group">
                  <legend>{isAr ? functioningQuestion.promptAr : functioningQuestion.prompt}</legend>
                  <p className="muted">{isAr ? functioningQuestion.justificationAr : functioningQuestion.justification}</p>
                  {(isAr ? functioningQuestion.optionsAr : functioningQuestion.options).map((label, value) => (
                    <label className="radio-option" key={value}>
                      <input
                        type="radio"
                        name="functioning"
                        value={value}
                        checked={functioning === value}
                        onChange={() => setFunctioning(value)}
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>

                <fieldset disabled={busy} className="question-group">
                  <legend>{isAr ? 'إشارات رفاه اختيارية' : 'Optional opt-in wellbeing & physical-health signals'}</legend>
                  {optInSignalsConfig.map(signal => (
                    <label className="radio-option check-option" key={signal.id}>
                      <input
                        type="checkbox"
                        checked={optInSignals.includes(signal.id)}
                        onChange={() => toggleSignal(signal.id)}
                      />
                      <span>
                        <strong>{isAr ? signal.labelAr : signal.label}</strong>
                        <span className="muted signal-why">{isAr ? signal.justificationAr : signal.justification}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>
            )}

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {draftMsg && (
              <p className="notice" role="status">
                {draftMsg}
              </p>
            )}
            <div className="actions">
              <Button
                className="button-secondary"
                disabled={busy}
                onClick={() => {
                  setError('')
                  if (step === 0) setInstrumentId(null)
                  else setStep(step - 1)
                }}
              >
                {isAr ? 'السابق' : 'Back'}
              </Button>
              <Button className="button-secondary" disabled={busy} onClick={saveForLater}>
                {isAr ? 'حفظ والمتابعة لاحقاً' : 'Save & resume later'}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy
                  ? isAr
                    ? 'جاري الحفظ…'
                    : 'Saving…'
                  : step === totalSteps - 1
                    ? isAr
                      ? 'إرسال التقييم'
                      : 'Submit assessment'
                    : isAr
                      ? 'التالي'
                      : 'Next'}
              </Button>
            </div>
          </form>
          <p className="muted">
            {isAr ? instrumentNoticeAr : instrumentNotice}{' '}
            <a href={instrument.source} target="_blank" rel="noreferrer">
              {isAr ? 'المرجع الرسمي للأداة' : 'Official instrument reference'}
            </a>
          </p>
        </div>
      )}
    </section>
  )
}
