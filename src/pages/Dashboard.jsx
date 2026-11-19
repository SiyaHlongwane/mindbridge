import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../context/auth'
import { useI18n } from '../context/i18n'
import { compareAssessments, hasSelfHarmResponse, instruments } from '../data/instruments'
import { getAssessment, listAssessments } from '../services/assessmentService'
import { updatePhysicalContext } from '../services/consentService'
import Button from '../components/Button'
import ReferralSummary from '../components/ReferralSummary'
import SafetyPanel from '../components/SafetyPanel'

const COMMON_CONDITIONS = [
  'Sleep disruption',
  'Diabetes / blood-sugar management',
  'Hypertension / cardiovascular',
  'Thyroid / metabolic care',
  'Chronic pain / fatigue',
  'Asthma / respiratory',
  'Maternal / postpartum care',
]

export default function Dashboard() {
  const { profile, user, consents, profileError, refreshProfile } = useAuth()
  const { lang, formatDate } = useI18n()
  const isAr = lang === 'ar'
  const [state, setState] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [physBusy, setPhysBusy] = useState(false)
  const [physMsg, setPhysMsg] = useState('')
  const [physError, setPhysError] = useState('')
  const [draftConditions, setDraftConditions] = useState(null)
  const selectedConditions = draftConditions ?? profile?.physical_context?.conditions ?? []

  useEffect(() => {
    let active = true
    listAssessments(user.id)
      .then(async rows => {
        const latestPhq = rows.find(r => r.instrument === 'PHQ9')
        let latestPhqFull = latestPhq
        if (latestPhq && !Array.isArray(latestPhq.answers)) {
          latestPhqFull = await getAssessment(user.id, latestPhq.id).catch(() => latestPhq)
        }
        const urgentRecent = latestPhqFull ? hasSelfHarmResponse('PHQ9', latestPhqFull.answers) : false
        if (active) setState({ userId: user.id, rows, urgentRecent })
      })
      .catch(error => {
        if (active) setState({ userId: user.id, error: error.message || 'Unable to load your assessments.' })
      })
    return () => {
      active = false
    }
  }, [user.id, attempt])

  async function savePhysical(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setPhysBusy(true)
    setPhysMsg('')
    setPhysError('')
    try {
      await updatePhysicalContext(user.id, {
        conditions: selectedConditions,
        primary_care_note: data.get('primary_care_note') || '',
        medications_note: data.get('medications_note') || '',
        malaffi_simulated: profile?.physical_context?.malaffi_simulated || null,
      })
      await refreshProfile()
      setDraftConditions(null)
      setPhysMsg('Coordinated physical health context saved.')
    } catch (err) {
      setPhysError(err.message || 'Unable to save physical context.')
    } finally {
      setPhysBusy(false)
    }
  }

  function toggleCondition(cond) {
    setDraftConditions(prev => {
      const base = prev ?? profile?.physical_context?.conditions ?? []
      return base.includes(cond) ? base.filter(c => c !== cond) : [...base, cond]
    })
  }

  const locale = isAr ? 'ar-AE' : 'en-GB'
  const name = profile?.full_name || user.user_metadata?.full_name
  const ready = state?.userId === user.id
  const rows = ready && !state.error ? state.rows : []
  const trend = [...rows].reverse().map(row => ({ time: Date.parse(row.created_at), [row.instrument]: row.total_score }))
  const trendYMax = rows.reduce((max, row) => Math.max(max, instruments[row.instrument]?.max || 27), 27)
  const malaffiSim = profile?.physical_context?.malaffi_simulated

  return (
    <section className="dashboard-page">
      {ready && state.urgentRecent && <SafetyPanel />}
      <p className="eyebrow">{isAr ? 'مساحتك الشخصية للرفاه' : 'YOUR WELLBEING SPACE'}</p>
      <h1>{isAr ? `مرحباً${name ? `، ${name}` : ''}` : `Welcome${name ? `, ${name}` : ''}`}</h1>
      <p>
        {isAr
          ? 'تساعدك الفحوصات المنتظمة على ملاحظة التغيرات مبكراً. هذه الأداة مساندة وليست تشخيصاً طبياً.'
          : 'Regular check-ins help you recognise changes early over time. Screening is voluntary and is never a medical diagnosis.'}
      </p>
      {profileError && (
        <p className="error" role="alert">
          {profileError}
        </p>
      )}
      <div className="actions">
        <Link className="button" to="/assessment">
          {isAr ? 'إجراء تقييم جديد' : 'Take an assessment'}
        </Link>
        <Link className="button button-secondary" to="/support">
          {isAr ? 'استكشاف دليل الدعم' : 'Explore stepped support'}
        </Link>
      </div>

      {!ready ? (
        <p role="status">Loading your assessments…</p>
      ) : state.error ? (
        <div className="error" role="alert">
          <p>{state.error}</p>
          <Button onClick={() => setAttempt(attempt + 1)}>Try again</Button>
        </div>
      ) : (
        <>
          <div className="assessment-choices">
            {Object.entries(instruments).map(([id, tool]) => {
              const matching = rows.filter(row => row.instrument === id)
              const latest = matching[0]
              const previous = matching[1]
              const change = compareAssessments(latest, previous, locale)
              return (
                <article className="card" key={id}>
                  <h2>{isAr ? tool.nameAr : `Latest ${tool.name}`}</h2>
                  {latest ? (
                    <>
                      <p className="result-score">
                        {latest.total_score}
                        <span> / {tool.max}</span>
                      </p>
                      <p>
                        {latest.severity} range
                        <br />
                        <span className="muted">{formatDate(latest.created_at)}</span>
                      </p>
                      {change && <p className="muted">{change.summary}</p>}
                      <Link to={`/results/${latest.id}`}>{isAr ? 'عرض التفسير والخطوات التالية' : 'View meaning & next steps'}</Link>
                    </>
                  ) : (
                    <p className="muted">No {tool.name} check-in recorded yet.</p>
                  )}
                </article>
              )
            })}
          </div>

          <section className="card dashboard-section" aria-labelledby="trend-title">
            <h2 id="trend-title">{isAr ? 'تطوّر المؤشرات عبر الزمن' : 'Wellbeing change over time'}</h2>
            {trend.length === 0 ? (
              <p>No scores yet. Your chart will appear after your first assessment.</p>
            ) : (
              <>
                <p className="muted">
                  PHQ-9 (0–27), GAD-7 (0–21), PSS-10 (0–40): lower indicates fewer symptoms. WHO-5 (0–100): higher indicates stronger wellbeing.
                </p>
                <div className="trend-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} accessibilityLayer margin={{ top: 12, right: 20, bottom: 12, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="time"
                        type="number"
                        scale="time"
                        domain={trend.length === 1 ? [trend[0].time - 86400000, trend[0].time + 86400000] : ['dataMin', 'dataMax']}
                        tickFormatter={value => new Date(value).toLocaleDateString(locale)}
                      />
                      <YAxis domain={[0, trendYMax]} allowDecimals={false} />
                      <Tooltip labelFormatter={value => formatDate(value)} />
                      <Legend />
                      <Line name="PHQ-9 (mood)" dataKey="PHQ9" stroke="#0F8B8D" strokeWidth={2} dot={{ r: 5 }} connectNulls isAnimationActive={false} />
                      <Line name="GAD-7 (anxiety)" dataKey="GAD7" stroke="#102A43" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 5 }} connectNulls isAnimationActive={false} />
                      <Line name="PSS-10 (stress)" dataKey="PSS10" stroke="#64748B" strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={false} />
                      <Line name="WHO-5 (wellbeing %)" dataKey="WHO5" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </section>

          <section className="card dashboard-section" aria-labelledby="coord-care-title">
            <h2 id="coord-care-title">{isAr ? 'تنسيق الرعاية الجسدية والنفسية (اختياري)' : 'Coordinated physical & mental care (optional)'}</h2>
            <p className="muted">
              Sharing is currently <strong>{consents.share_physical_context ? 'On' : 'Off'}</strong> (<Link to="/privacy">manage in Privacy</Link>). Never exposed to employers.
            </p>
            {malaffiSim && (
              <div className="notice" role="region" aria-label="Simulated Malaffi Summary">
                <strong>{malaffiSim.source}</strong>
                <p>
                  Clinic: {malaffiSim.primary_clinic} · BP: {malaffiSim.last_bp} · HbA1c: {malaffiSim.hba1c} · TSH: {malaffiSim.tsh} · Vitamin D: {malaffiSim.vitamin_d}
                </p>
              </div>
            )}
            <form key={profile?.physical_context?.updated_at || 'empty'} className="consent-form" onSubmit={savePhysical}>
              <div className="chip-grid" role="group" aria-label="Relevant physical health context">
                {COMMON_CONDITIONS.map(cond => (
                  <label key={cond} className="check-chip">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(cond)}
                      disabled={physBusy}
                      onChange={() => toggleCondition(cond)}
                    />
                    <span>{cond}</span>
                  </label>
                ))}
              </div>
              <label>
                Primary-care or comorbidity context (optional)
                <textarea
                  name="primary_care_note"
                  rows={2}
                  maxLength={1000}
                  defaultValue={profile?.physical_context?.primary_care_note || ''}
                  placeholder="e.g., Ongoing fatigue alongside thyroid/diabetes follow-up"
                  disabled={physBusy}
                />
              </label>
              <label>
                Relevant medications or care team note (optional)
                <input
                  name="medications_note"
                  maxLength={300}
                  defaultValue={profile?.physical_context?.medications_note || ''}
                  placeholder="e.g., Levothyroxine 50mcg, regular family physician review"
                  disabled={physBusy}
                />
              </label>
              {physMsg && <p className="notice" role="status">{physMsg}</p>}
              {physError && <p className="error" role="alert">{physError}</p>}
              <div>
                <Button type="submit" className="button-secondary" disabled={physBusy}>
                  {physBusy ? 'Saving…' : 'Save physical context'}
                </Button>
              </div>
            </form>
          </section>

          <section className="card dashboard-section">
            <h2>{isAr ? 'سجل التقييمات' : 'Assessment history'}</h2>
            {rows.length === 0 ? (
              <p>No assessments saved yet.</p>
            ) : (
              <div className="table-scroll" tabIndex={0} role="region" aria-label="Assessment history">
                <table>
                  <caption>Saved assessments, newest first</caption>
                  <thead>
                    <tr>
                      <th scope="col">Completed</th>
                      <th scope="col">Assessment</th>
                      <th scope="col">Score</th>
                      <th scope="col">Range</th>
                      <th scope="col">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <tr key={row.id}>
                        <td>{formatDate(row.created_at)}</td>
                        <td>{instruments[row.instrument]?.name || row.instrument}</td>
                        <td>{row.total_score}</td>
                        <td>{row.severity}</td>
                        <td>
                          <Link to={`/results/${row.id}`}>View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      <ReferralSummary />
    </section>
  )
}
