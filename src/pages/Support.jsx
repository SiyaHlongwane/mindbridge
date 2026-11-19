import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useI18n } from '../context/i18n'
import { getAssessment, listAssessments } from '../services/assessmentService'
import { listServices, recommendTiers, TIERS } from '../services/supportService'
import SafetyPanel from '../components/SafetyPanel'
import Button from '../components/Button'

function websiteLink(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

export default function Support() {
  const { user } = useAuth()
  const { lang } = useI18n()
  const isAr = lang === 'ar'
  const [state, setState] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('all')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      const [servicesResult, assessmentResult] = await Promise.allSettled([
        listServices(),
        (async () => {
          const history = await listAssessments(user.id)
          const latest = ['PHQ9', 'GAD7', 'PSS10', 'WHO5'].map(id => history.find(row => row.instrument === id)).filter(Boolean)
          return Promise.all(
            latest.map(row =>
              getAssessment(user.id, row.id).then(saved => {
                if (!saved) throw new Error('A recent assessment is no longer available. Please reload.')
                return saved
              })
            )
          )
        })(),
      ])
      if (active) {
        setState({
          userId: user.id,
          services: servicesResult.status === 'fulfilled' ? servicesResult.value : [],
          servicesError: servicesResult.status === 'rejected' ? servicesResult.reason.message || 'Unable to load support services.' : '',
          assessments: assessmentResult.status === 'fulfilled' ? assessmentResult.value : [],
          assessmentError: assessmentResult.status === 'rejected' ? assessmentResult.reason.message || 'Unable to load your latest assessments.' : '',
        })
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [user.id, attempt])

  const ready = state?.userId === user.id
  const recommendation = recommendTiers(ready ? state.assessments : [])
  const normalizedQuery = search.trim().toLowerCase()

  return (
    <section className="dashboard-page">
      {ready && recommendation.urgent && <SafetyPanel />}
      <p className="eyebrow">{isAr ? 'دليل الرعاية المتدرجة في أبوظبي' : 'ABU DHABI STEPPED CARE NAVIGATION'}</p>
      <h1>{isAr ? 'اكتشف الدعم المناسب لاحتياجاتك' : 'Stepped local & tele-mental support'}</h1>
      <p>
        {isAr
          ? 'اختر المستوى الأنسب لك من المساعدة الذاتية والدعم المجتمعي إلى الرعاية الأولية والصحة النفسية عن بُعد والتخصصية. هذا توجيه داعم وليس وصفة إلزامية.'
          : 'Match your needs to trusted Abu Dhabi pathways — self-help, community support, primary care, tele-mental health, specialist care, or urgent assistance.'}
      </p>
      <p className="notice">
        <strong>Abu Dhabi ecosystem notice:</strong> Directory references to TAMM, Malaffi, and local clinics use clearly labelled demonstration records unless verified; no official external integration or partnership is claimed. For urgent human guidance call Sakina <strong>800-725462</strong> or UAE Ambulance <strong>998</strong>.
      </p>

      {!ready ? (
        <p role="status">Loading support options…</p>
      ) : (
        <>
          <section className="card dashboard-section" aria-labelledby="recommended-title">
            <h2 id="recommended-title">{isAr ? 'مقترح لك' : 'Recommended for you'}</h2>
            {state.assessmentError ? (
              <p className="error" role="alert">
                {state.assessmentError} You can still browse all support levels below.
              </p>
            ) : state.assessments.length === 0 ? (
              <p>
                <Link to="/assessment">Take a voluntary assessment</Link> for stepped guidance tailored to your responses, or explore any support level below.
              </p>
            ) : (
              <>
                <p>Based on your latest screening range and opt-in context. Final clinical decisions remain with licensed healthcare professionals.</p>
                <ul>
                  {recommendation.tiers.map(id => {
                    const tier = TIERS.find(item => item.id === id)
                    return tier ? (
                      <li key={id}>
                        <button type="button" className="tier-link" onClick={() => setFilter(id)}>
                          {isAr ? tier.labelAr : tier.label}
                        </button>
                      </li>
                    ) : null
                  })}
                </ul>
              </>
            )}
            {(state.servicesError || state.assessmentError) && (
              <div className="actions">
                <Button variant="secondary" onClick={() => setAttempt(attempt + 1)}>
                  {isAr ? 'إعادة المحاولة' : 'Retry loading'}
                </Button>
              </div>
            )}
          </section>

          <div className="card dashboard-section">
            <div className="equity-form-grid">
              <label>
                {isAr ? 'ابحث عن مزود أو خدمة' : 'Search providers or services'}
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="e.g., tele-mental, Abu Dhabi, Al Ain, CBT…"
                />
              </label>
              <label>
                {isAr ? 'اللغة المدعومة' : 'Filter by language'}
                <select value={langFilter} onChange={e => setLangFilter(e.target.value)}>
                  <option value="all">All languages</option>
                  <option value="Arabic">Arabic</option>
                  <option value="English">English</option>
                </select>
              </label>
            </div>
          </div>

          <div className="tier-filters" role="group" aria-label="Filter support by level">
            {[{ id: 'all', label: 'All levels', labelAr: 'جميع المستويات' }, ...TIERS].map(tier => (
              <Button
                key={tier.id}
                className={filter === tier.id ? '' : 'button-secondary'}
                aria-pressed={filter === tier.id}
                onClick={() => setFilter(tier.id)}
              >
                {isAr && tier.labelAr ? tier.labelAr : tier.label}
              </Button>
            ))}
          </div>

          {state.servicesError ? (
            <p className="error" role="alert">
              {state.servicesError}
            </p>
          ) : (
            TIERS.filter(tier => filter === 'all' || filter === tier.id).map(tier => {
              const services = state.services.filter(service => {
                if (service.tier !== tier.id) return false
                if (langFilter !== 'all' && !(service.languages || '').toLowerCase().includes(langFilter.toLowerCase())) return false
                if (normalizedQuery) {
                  const hay = `${service.name} ${service.description} ${service.location || ''} ${service.geography || ''} ${service.eligibility || ''}`.toLowerCase()
                  if (!hay.includes(normalizedQuery)) return false
                }
                return true
              })
              return (
                <section className="support-tier" key={tier.id} aria-labelledby={`tier-${tier.id}`}>
                  <h2 id={`tier-${tier.id}`}>{isAr ? tier.labelAr : tier.label}</h2>
                  <p>{tier.description}</p>
                  {services.length === 0 ? (
                    <p className="muted">No matching listings at this level.</p>
                  ) : (
                    <div className="support-grid">
                      {services.map(service => {
                        const website = websiteLink(service.website)
                        return (
                          <article className="card" key={service.id}>
                            <h3>{service.name}</h3>
                            <span className="badge">
                              {service.verified ? 'Verified guidance' : 'Demonstration listing'}
                            </span>
                            <p>{service.description || 'Description not available.'}</p>
                            <dl className="service-meta">
                              <dt>Location</dt>
                              <dd>{service.location || service.geography || 'Abu Dhabi'}</dd>
                              <dt>Languages</dt>
                              <dd>{service.languages || 'Arabic, English'}</dd>
                              <dt>Eligibility</dt>
                              <dd>{service.eligibility || 'Check at intake'}</dd>
                              <dt>Hours</dt>
                              <dd>{service.operating_hours || 'Sun–Thu 08:00–18:00'}</dd>
                              <dt>Appointment</dt>
                              <dd>{service.appointment_method || service.delivery_mode || 'MindBridge referral'}</dd>
                              <dt>Availability</dt>
                              <dd>{service.availability || service.typical_wait || 'Available'}</dd>
                              <dt>Last verified</dt>
                              <dd>{service.last_verified_at || 'Demo record'}</dd>
                            </dl>
                            <p>
                              <strong>Contact:</strong> {service.contact || 'Contact details not available.'}
                            </p>
                            {website && (
                              <p>
                                <a href={website} target="_blank" rel="noopener noreferrer">
                                  Visit official portal<span className="muted"> (opens new tab)</span>
                                </a>
                              </p>
                            )}
                            <Link
                              className="button"
                              to={`/referrals?service=${encodeURIComponent(service.id)}${recommendation.urgent ? '&urgent=1' : ''}`}
                            >
                              {isAr ? 'طلب إحالة وموعد' : 'Request referral & appointment'}
                            </Link>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })
          )}
        </>
      )}
    </section>
  )
}
