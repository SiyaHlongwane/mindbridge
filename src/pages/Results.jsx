import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { getAssessment } from '../services/assessmentService'
import { hasSelfHarmResponse, instruments, scoreAssessment } from '../data/instruments'
import SafetyPanel from '../components/SafetyPanel'
import Button from '../components/Button'

const meanings = {
  minimal: 'Your responses suggest few symptoms over the last two weeks. Your experiences still matter, and support is available whenever you need it.',
  mild: 'Your responses suggest some symptoms over the last two weeks. Small supportive steps and talking with someone you trust may help.',
  moderate: 'Your responses suggest symptoms that may be affecting daily life. Consider talking with a qualified professional about how you have been feeling.',
  'moderately severe': 'Your responses suggest symptoms that may be making daily life difficult. A qualified professional can help you explore support that fits your needs.',
  severe: 'Your responses suggest a substantial level of symptoms. You deserve support; consider speaking with a qualified professional about the next steps.',
}

export default function Results() {
  const { id } = useParams()
  const { user } = useAuth()
  const [state, setState] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    getAssessment(user.id, id).then(row => {
      const score = row ? scoreAssessment(row.instrument, row.answers) : null
      if (active) setState({ id, userId: user.id, row, score })
    }).catch(error => { if (active) setState({ id, userId: user.id, error: error.message || 'Unable to load your result.' }) })
    return () => { active = false }
  }, [id, user.id, attempt])
  if (!state || state.id !== id || state.userId !== user.id) return <p role="status">Loading your result…</p>
  if (state.error) return <section className="page-intro"><h1>Unable to load this result</h1><p className="error" role="alert">{state.error}</p><Button onClick={() => setAttempt(attempt + 1)}>Try again</Button></section>
  if (!state.row) return <section className="page-intro"><h1>Result not found</h1><p>This result does not exist or is not available to your account.</p><Link to="/dashboard">Back to dashboard</Link></section>
  const { row, score } = state
  const instrument = instruments[row.instrument]
  const lowerBand = ['minimal', 'mild'].includes(score.severity)
  return <section className="page-intro">
    {hasSelfHarmResponse(row.instrument, row.answers) && <SafetyPanel />}
    <p className="eyebrow">YOUR SCREENING RESULT</p><h1>{instrument.name}: a snapshot of your {instrument.focus}</h1><div className="card"><p className="result-score">{score.total}<span> / {instrument.max}</span></p><h2>{score.severity} symptom range</h2><p><strong>This is a screening result, not a diagnosis.</strong></p><p>{meanings[score.severity]}</p><p className="muted">Completed {new Date(row.created_at).toLocaleString()}. Scores describe reported symptoms, not who you are.</p></div>
    <div className="card next-steps"><h2>Your next step</h2>{lowerBand ? <p>Consider self-help resources and community support. If you would like to check in again, retake the assessment in 2 weeks. You can seek professional support at any score.</p> : <p>Consider speaking with a primary care or mental health professional. They can discuss your experiences with you and help decide what support is appropriate.</p>}<div className="actions"><Link className="button" to="/support">Explore support options</Link><Link className="button button-secondary" to="/dashboard">Back to dashboard</Link></div></div>
  </section>
}
