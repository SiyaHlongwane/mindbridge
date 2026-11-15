import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { getAssessment, listAssessments } from '../services/assessmentService'
import { listServices, recommendTiers, TIERS } from '../services/supportService'
import SafetyPanel from '../components/SafetyPanel'
import Button from '../components/Button'

function websiteLink(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch { return null }
}

export default function Support() {
  const { user } = useAuth()
  const [state, setState] = useState(null)
  const [filter, setFilter] = useState('all')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      const [servicesResult, assessmentResult] = await Promise.allSettled([
        listServices(),
        (async () => {
          const history = await listAssessments(user.id)
          const latest = ['PHQ9', 'GAD7'].map(id => history.find(row => row.instrument === id)).filter(Boolean)
          return Promise.all(latest.map(row => getAssessment(user.id, row.id).then(saved => {
            if (!saved) throw new Error('A recent assessment is no longer available. Please reload.')
            return saved
          })))
        })(),
      ])
      if (active) setState({
        userId: user.id,
        services: servicesResult.status === 'fulfilled' ? servicesResult.value : [],
        servicesError: servicesResult.status === 'rejected' ? servicesResult.reason.message || 'Unable to load support services.' : '',
        assessments: assessmentResult.status === 'fulfilled' ? assessmentResult.value : [],
        assessmentError: assessmentResult.status === 'rejected' ? assessmentResult.reason.message || 'Unable to load your latest assessments.' : '',
      })
    }
    void load()
    return () => { active = false }
  }, [user.id, attempt])
  const ready = state?.userId === user.id
  const recommendation = recommendTiers(ready ? state.assessments : [])
  return <section className="dashboard-page">
    {ready && recommendation.urgent && <SafetyPanel />}
    <p className="eyebrow">FIND YOUR NEXT STEP</p><h1>Support at your pace</h1><p>Stepped care offers different levels of support, from everyday resources to specialist services. You can choose any level; this is guidance, not a prescription.</p><p className="notice">Demo directory: unverified listings are examples, not verified providers or emergency contacts. Confirm service details before relying on a listing.</p>
    {!ready ? <p role="status">Loading support options and your preferences…</p> : <>
      <section className="card dashboard-section" aria-labelledby="recommended-title"><h2 id="recommended-title">Recommended for you</h2>{state.assessmentError ? <p className="error" role="alert">{state.assessmentError} Recommendations and the assessment-based safety check are unavailable. You can still browse all support levels.</p> : state.assessments.length === 0 ? <p><Link to="/assessment">Take a voluntary assessment</Link> for guidance based on your responses. You can also start with self-help or community support, or choose any level below.</p> : <><p>Based on the highest symptom range in your latest mood and anxiety check-ins. This is not a diagnosis.</p><ul>{recommendation.tiers.map(id => <li key={id}><button type="button" className="tier-link" onClick={() => setFilter(id)}>{TIERS.find(tier => tier.id === id).label}</button></li>)}</ul></>}</section>
      {(state.servicesError || state.assessmentError) && <div className="actions"><Button onClick={() => setAttempt(attempt + 1)}>Retry loading</Button></div>}
      <div className="tier-filters" role="group" aria-label="Filter support by level">{[{ id: 'all', label: 'All levels' }, ...TIERS].map(tier => <Button key={tier.id} className={filter === tier.id ? '' : 'button-secondary'} aria-pressed={filter === tier.id} onClick={() => setFilter(tier.id)}>{tier.label}</Button>)}</div>
      {state.servicesError ? <p className="error" role="alert">{state.servicesError}</p> : state.services.length === 0 ? <p className="card" role="status">No active support listings are available yet. Please check again later.</p> : <>
        {TIERS.filter(tier => filter === 'all' || filter === tier.id).map(tier => {
          const services = state.services.filter(service => service.tier === tier.id)
          return <section className="support-tier" key={tier.id} aria-labelledby={`tier-${tier.id}`}><h2 id={`tier-${tier.id}`}>{tier.label}</h2><p>{tier.description}</p>{services.length === 0 ? <p className="muted">No active listings at this level yet.</p> : <div className="support-grid">{services.map(service => {
            const website = websiteLink(service.website)
            return <article className="card" key={service.id}><h3>{service.name}</h3>{!service.verified && <span className="badge">Unverified demo listing</span>}<p>{service.description || 'Description not available.'}</p><p><strong>Contact:</strong> {service.contact || 'Contact details not available.'}</p>{website && <p><a href={website} target="_blank" rel="noopener noreferrer">Visit website<span className="muted"> (opens a new tab)</span></a></p>}<Link className="button" to={`/referrals?service=${encodeURIComponent(service.id)}`}>Request referral</Link></article>
          })}</div>}</section>
        })}
      </>}
    </>}
  </section>
}
