import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../context/auth'
import { instruments } from '../data/instruments'
import { listAssessments } from '../services/assessmentService'
import Button from '../components/Button'
import ReferralSummary from '../components/ReferralSummary'

export default function Dashboard() {
  const { profile, user, profileError } = useAuth()
  const [state, setState] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    listAssessments(user.id).then(rows => { if (active) setState({ userId: user.id, rows }) }).catch(error => {
      if (active) setState({ userId: user.id, error: error.message || 'Unable to load your assessments.' })
    })
    return () => { active = false }
  }, [user.id, attempt])
  const name = profile?.full_name || user.user_metadata?.full_name
  const ready = state?.userId === user.id
  const rows = ready && !state.error ? state.rows : []
  const trend = [...rows].reverse().map(row => ({ time: Date.parse(row.created_at), [row.instrument]: row.total_score }))
  const yMax = trend.some(pt => pt.PHQ9 != null) ? 27 : trend.some(pt => pt.GAD7 != null) ? 21 : 27
  return <section className="dashboard-page"><p className="eyebrow">YOUR WELLBEING SPACE</p><h1>Welcome{name ? `, ${name}` : ''}</h1><p>Small check-ins can help you reflect on changes over time. Screening is not a diagnosis.</p>{profileError && <p className="error" role="alert">{profileError}</p>}<div className="actions"><Link className="button" to="/assessment">Take an assessment</Link><Link className="button button-secondary" to="/support">Explore support</Link></div>
    {!ready ? <p role="status">Loading your assessments…</p> : state.error ? <div className="error" role="alert"><p>{state.error}</p><Button onClick={() => setAttempt(attempt + 1)}>Try again</Button></div> : <>
      <div className="assessment-choices">{Object.entries(instruments).map(([id, tool]) => {
        const latest = rows.find(row => row.instrument === id)
        return <article className="card" key={id}><h2>Latest {tool.name}</h2>{latest ? <><p className="result-score">{latest.total_score}<span> / {tool.max}</span></p><p>{latest.severity} symptom range<br /><span className="muted">{new Date(latest.created_at).toLocaleString()}</span></p><Link to={`/results/${latest.id}`}>View result and next steps</Link></> : <p>No {tool.focus} assessment yet. Take one whenever you feel ready.</p>}</article>
      })}</div>
      <section className="card dashboard-section" aria-labelledby="trend-title"><h2 id="trend-title">Your check-ins over time</h2>{trend.length === 0 ? <p>No scores yet. Your chart will appear after your first assessment.</p> : <><p className="muted">PHQ-9 ranges from 0–27; GAD-7 ranges from 0–21. Different tools measure different symptoms; scores are not directly equivalent. {trend.length === 1 && 'One check-in is a starting point, not a trend.'}</p><div className="trend-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} accessibilityLayer margin={{ top: 12, right: 20, bottom: 12, left: 0 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" type="number" scale="time" domain={trend.length === 1 ? [trend[0].time - 86400000, trend[0].time + 86400000] : ['dataMin', 'dataMax']} tickFormatter={value => new Date(value).toLocaleDateString()} /><YAxis domain={[0, yMax]} allowDecimals={false} /><Tooltip labelFormatter={value => new Date(value).toLocaleString()} /><Legend /><Line name="PHQ-9 (mood)" dataKey="PHQ9" stroke="#287C78" strokeWidth={2} dot={{ r: 5 }} connectNulls isAnimationActive={false} /><Line name="GAD-7 (anxiety)" dataKey="GAD7" stroke="#123C46" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 5 }} connectNulls isAnimationActive={false} /></LineChart></ResponsiveContainer></div><p className="muted">Exact scores and dates are also available in the history table below.</p></>}</section>
      <section className="card dashboard-section"><h2>Assessment history</h2>{rows.length === 0 ? <p>No assessments saved yet.</p> : <div className="table-scroll" tabIndex={0} role="region" aria-label="Assessment history"><table><caption>Saved assessments, newest first</caption><thead><tr><th scope="col">Completed</th><th scope="col">Assessment</th><th scope="col">Score</th><th scope="col">Symptom range</th><th scope="col">Result</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString()}</td><td>{instruments[row.instrument]?.name || row.instrument}</td><td>{row.total_score}</td><td>{row.severity}</td><td><Link to={`/results/${row.id}`} aria-label={`View ${instruments[row.instrument]?.name || row.instrument} result from ${new Date(row.created_at).toLocaleString()}`}>View</Link></td></tr>)}</tbody></table></div>}</section>
    </>}
    <ReferralSummary />
  </section>
}
