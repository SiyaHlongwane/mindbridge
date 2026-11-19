import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../context/auth'
import { SMALL_CELL_THRESHOLD, getOutcomeAndSafetyMetrics, updateAdverseEventStatus } from '../services/adminService'
import Button from '../components/Button'

const EQUITY_DIMENSIONS = [
  { id: 'geography', label: 'Geography' },
  { id: 'language', label: 'Preferred language' },
  { id: 'age_group', label: 'Age group' },
  { id: 'gender', label: 'Gender' },
  { id: 'nationality_group', label: 'Residency' },
]

export default function Analytics() {
  const { user, role } = useAuth()
  const [dateRange, setDateRange] = useState(30)
  const [equityDim, setEquityDim] = useState('geography')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    getOutcomeAndSafetyMetrics(dateRange)
      .then(result => {
        if (active) {
          setData(result)
          setError('')
        }
      })
      .catch(err => {
        if (active) setError(err.message || 'Unable to load population analytics.')
      })
    return () => {
      active = false
    }
  }, [user.id, dateRange, attempt])

  async function changeAdverseStatus(id, status) {
    try {
      await updateAdverseEventStatus(id, status)
      setAttempt(a => a + 1)
    } catch (err) {
      setError(err.message || 'Unable to update incident.')
    }
  }

  const equityRows = data?.equity?.[equityDim] || []
  const chartEquityRows = equityRows.filter(row => !row.suppressed)

  return (
    <section className="dashboard-page">
      <p className="eyebrow">DE-IDENTIFIED POPULATION HEALTH ANALYTICS</p>
      <h1>Outcomes, fairness &amp; safety monitoring</h1>
      <p>
        Aggregated, strictly de-identified metrics. The Population Health Analyst role never accesses individual clinical records. Only individuals with active <strong>research opt-in</strong> consent are included{data ? ` (${data.optedInCount} opted-in individuals)` : ''}, and subgroups with fewer than {SMALL_CELL_THRESHOLD} individuals are suppressed to prevent re-identification.
      </p>

      <div className="actions">
        <label>
          Date range:{' '}
          <select value={dateRange} onChange={e => setDateRange(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={0}>All time</option>
          </select>
        </label>
        <Button className="button-secondary" onClick={() => setAttempt(a => a + 1)}>
          Refresh analytics
        </Button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {!data ? (
        <p role="status">Loading de-identified analytics…</p>
      ) : (
        <>
          <section className="card dashboard-section">
            <h2>Core outcome &amp; follow-up indicators</h2>
            <div className="kpi-grid">
              <div className="kpi-box">
                <span className="muted">Positive screen → hand-off conversion</span>
                <strong className="kpi-value">{data.conversionRate}%</strong>
                <span className="muted">{data.convertedCount} / {data.positiveScreenCount} moderate/high screens</span>
              </div>
              <div className="kpi-box">
                <span className="muted">Referral completion rate</span>
                <strong className="kpi-value">{data.referralCompletionRate}%</strong>
                <span className="muted">Follow-up completed end-to-end</span>
              </div>
              <div className="kpi-box">
                <span className="muted">Appointment attendance</span>
                <strong className="kpi-value">{data.attendanceRate}%</strong>
                <span className="muted">Attended of scheduled visits</span>
              </div>
              <div className="kpi-box">
                <span className="muted">Follow-up within SLA</span>
                <strong className="kpi-value">{data.slaComplianceRate}%</strong>
                <span className="muted">Avg wait: {data.avgWaitHours}h · Median: {data.medianWaitHours}h</span>
              </div>
              <div className="kpi-box">
                <span className="muted">Wellbeing score improvement</span>
                <strong className="kpi-value">{data.improvementRate}%</strong>
                <span className="muted">Repeat screens &amp; clinician outcomes</span>
              </div>
              <div className="kpi-box">
                <span className="muted">Crisis handover completion</span>
                <strong className="kpi-value">{data.crisisCompletionRate}%</strong>
                <span className="muted">{data.crisisCompleted} / {data.crisisTotal} urgent cases completed</span>
              </div>
            </div>

            {data.alerts.length > 0 && (
              <div className="notice" role="status">
                <strong>Equity &amp; capacity alerts</strong>
                <ul>
                  {data.alerts.map(alert => (
                    <li key={alert}>{alert}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="card dashboard-section">
            <h2>Service tier utilisation</h2>
            <div className="trend-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.serviceUtilisation} margin={{ top: 12, right: 20, bottom: 12, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tier" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar name="Referrals" dataKey="count" fill="#102A43" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card dashboard-section">
            <h2>Demographic fairness &amp; small-cell privacy suppression</h2>
            <p className="muted">
              Cells with fewer than {SMALL_CELL_THRESHOLD} individuals display as <em>Suppressed (&lt;{SMALL_CELL_THRESHOLD})</em> to prevent re-identification.
            </p>
            <div className="tier-filters" role="group" aria-label="Equity dimension">
              {EQUITY_DIMENSIONS.map(dim => (
                <Button
                  key={dim.id}
                  className={equityDim === dim.id ? '' : 'button-secondary'}
                  aria-pressed={equityDim === dim.id}
                  onClick={() => setEquityDim(dim.id)}
                >
                  {dim.label}
                </Button>
              ))}
            </div>

            {chartEquityRows.length > 0 && (
              <div className="trend-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartEquityRows} margin={{ top: 12, right: 20, bottom: 12, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="group" />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip />
                    <Bar name="Hand-off conversion (%)" dataKey="conversionRate" fill="#0F8B8D" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="table-scroll" tabIndex={0}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Subgroup</th>
                    <th scope="col">Individuals</th>
                    <th scope="col">Positive screens</th>
                    <th scope="col">Hand-offs</th>
                    <th scope="col">Conversion</th>
                    <th scope="col">Avg wait</th>
                  </tr>
                </thead>
                <tbody>
                  {equityRows.map(row => (
                    <tr key={row.group}>
                      <td>{row.group}</td>
                      {row.suppressed ? (
                        <td colSpan={5} className="muted">
                          Suppressed (&lt;{SMALL_CELL_THRESHOLD} individuals) to protect privacy
                        </td>
                      ) : (
                        <>
                          <td>{row.individuals}</td>
                          <td>{row.positiveScreens}</td>
                          <td>{row.handoffs}</td>
                          <td>{row.conversionRate}%</td>
                          <td>{row.avgWaitHours !== null ? `${row.avgWaitHours}h` : 'Pending'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card dashboard-section">
            <h2>Adverse events &amp; safety incidents</h2>
            {data.adverseEvents.length === 0 ? (
              <p className="muted">No adverse events logged.</p>
            ) : (
              <div className="table-scroll" tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col">Severity</th>
                      <th scope="col">Summary</th>
                      <th scope="col">Action taken</th>
                      <th scope="col">Status</th>
                      {role === 'admin' && <th scope="col">Update</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.adverseEvents.map(ev => (
                      <tr key={ev.id}>
                        <td>{ev.category}</td>
                        <td>{ev.severity}</td>
                        <td className="wrap-cell">{ev.summary}</td>
                        <td className="wrap-cell">{ev.action_taken}</td>
                        <td>{ev.status}</td>
                        {role === 'admin' && (
                          <td>
                            <select value={ev.status} onChange={e => changeAdverseStatus(ev.id, e.target.value)}>
                              <option value="open">Open</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card dashboard-section">
            <h2>Responsible AI &amp; clinical scoring governance</h2>
            <p>
              <strong>Deterministic scoring separation:</strong> All PHQ-9, GAD-7, PSS-10, and WHO-5 scores are computed via deterministic clinical formulas, completely separate from any machine-learning experiment.
            </p>
            <p>
              <strong>ML boundaries:</strong> No unverified ML accuracy figures are fabricated in this interface. When Python/Scikit-learn models (Logistic Regression, Random Forest, Gradient Boosting) are evaluated offline, they are restricted strictly to navigation-dropout/wait-risk decision support — never to diagnose mental illness, never to clear suicide risk, and never to deny care. The platform remains 100% operational without ML services.
            </p>
          </section>
        </>
      )}
    </section>
  )
}
