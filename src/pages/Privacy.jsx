import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { eraseMyWellbeingData, setConsent, updateEquityProfile, withdrawSharing } from '../services/consentService'
import Button from '../components/Button'

const CONSENT_ITEMS = [
  {
    key: 'retain_history',
    label: 'Retain personal assessment history',
    consequence: 'Withdrawing stops long-term trend storage for future check-ins.',
  },
  {
    key: 'share_results',
    label: "Share my assessment results with professionals I'm referred to",
    consequence: 'Withdrawing immediately hides your scores on active referrals; clinicians will rely on direct conversation.',
  },
  {
    key: 'share_contact',
    label: "Share my name/contact with professionals I'm referred to",
    consequence: 'Withdrawing masks your name on active referrals, which may pause appointment scheduling until you re-confirm.',
  },
  {
    key: 'share_physical_context',
    label: 'Share my physical health & comorbidity context for coordinated primary/mental care',
    consequence: 'Withdrawing keeps physical-care summaries private from mental health referrals.',
  },
  {
    key: 'research_opt_in',
    label: 'Include my de-identified data in population health & fairness analytics',
    consequence: 'Withdrawing excludes future check-ins from aggregate service-planning reports.',
  },
]

export default function Privacy() {
  const { user, profile, loading, consents, consentDates, consentsLoading, consentError, refreshConsents, refreshProfile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [confirmErase, setConfirmErase] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function toggle(type, granted) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (granted) await setConsent(user.id, type, true)
      else await withdrawSharing(user.id, type)
      await refreshConsents()
      setMessage(
        granted
          ? 'Preference enabled for future activity. Existing referrals are not automatically opted in.'
          : 'Preference withdrawn. Active referrals and consent records were updated immediately.'
      )
    } catch (err) {
      setError(`${err.message || 'Unable to save your preference.'} Some changes may have saved. Please retry.`)
    } finally {
      setBusy(false)
    }
  }

  async function saveEquity(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await updateEquityProfile(user.id, {
        age_group: data.get('age_group') || '',
        gender: data.get('gender') || '',
        nationality_group: data.get('nationality_group') || '',
        language: data.get('language') || '',
        geography: data.get('geography') || '',
      })
      await refreshProfile()
      setMessage('Optional equity preferences updated (used only in de-identified, small-group-suppressed reporting).')
    } catch (err) {
      setError(err.message || 'Unable to save equity preferences.')
    } finally {
      setBusy(false)
    }
  }

  async function handleErase() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await eraseMyWellbeingData(user.id)
      await Promise.all([refreshConsents(), refreshProfile()])
      setConfirmErase(false)
      setMessage('Your saved assessments, referrals, physical-care context, and optional sharing preferences have been erased.')
    } catch (err) {
      setError(err.message || 'Unable to erase data.')
    } finally {
      setBusy(false)
    }
  }

  async function retry() {
    setBusy(true)
    setError('')
    try {
      await refreshConsents()
    } catch (err) {
      setError(err.message || 'Unable to load preferences.')
    } finally {
      setBusy(false)
    }
  }

  function date(type) {
    return consentDates[type] ? new Date(consentDates[type]).toLocaleString() : 'Not recorded'
  }

  const equity = profile?.equity || {}

  return (
    <section className="page-intro">
      <p className="eyebrow">YOUR INFORMATION, YOUR CHOICES</p>
      <h1>Privacy, autonomy &amp; Abu Dhabi safeguards</h1>
      <div className="card">
        <p>
          <strong>Data minimisation &amp; UAE/Abu Dhabi alignment:</strong> MindBridge AI is architected around data minimisation, granular revocable consent, role-based access control, and audit logging aligned with UAE Federal Law No. 2 of 2019 (ICT in Health), Cabinet Resolution No. 32 of 2020, Federal Decree-Law No. 45 of 2021, and DOH/ADHICS principles. No official regulatory certification is claimed for this prototype.
        </p>
        <p>
          <strong>Employer &amp; third-party firewall:</strong> Identifiable wellbeing scores, screening responses, and clinical notes are <strong>strictly prevented</strong> from being exposed to employers, HR teams, insurers, or unauthorized parties. Population Health Analysts see only aggregated metrics with small-group suppression (n &lt; 3 masked).
        </p>

        {loading || (user && consentsLoading) ? (
          <p role="status">Loading your preferences…</p>
        ) : !user ? (
          <p>
            <Link to="/login">Log in</Link> to view and manage your granular consent preferences.
          </p>
        ) : (
          <>
            {consentError && (
              <div className="error" role="alert">
                {consentError} <Button onClick={retry} disabled={busy}>Retry loading</Button>
              </div>
            )}
            {!consentError && (
              <>
                <h2>Your granular consent choices</h2>
                <div className="consent-item">
                  <h3>Required consent (completing assessments)</h3>
                  <p>
                    Status: <strong>{consents.terms === true ? 'Given' : 'Not given'}</strong> · Updated: {date('terms')}
                  </p>
                  {consents.terms !== true && <Link to="/consent">Review and give required consent</Link>}
                </div>

                {CONSENT_ITEMS.map(item => (
                  <div className="consent-item" key={item.key}>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={consents[item.key] === true}
                        disabled={busy}
                        onChange={event => toggle(item.key, event.target.checked)}
                      />
                      {item.label}
                    </label>
                    <p>
                      Status: <strong>{consents[item.key] === true ? 'Allowed' : 'Off'}</strong> · Updated: {date(item.key)}
                    </p>
                    <p className="muted">{item.consequence}</p>
                  </div>
                ))}

                <div className="consent-item">
                  <h3>Optional de-identified fairness &amp; language preferences</h3>
                  <p className="muted">Used strictly in aggregate with small-cell suppression to monitor equity across Abu Dhabi.</p>
                  <form className="consent-form" onSubmit={saveEquity}>
                    <div className="equity-form-grid">
                      <label>
                        Age group
                        <select name="age_group" defaultValue={equity.age_group || ''} disabled={busy}>
                          <option value="">Prefer not to say</option>
                          <option value="18-24">18–24</option>
                          <option value="25-34">25–34</option>
                          <option value="35-49">35–49</option>
                          <option value="50+">50+</option>
                        </select>
                      </label>
                      <label>
                        Gender
                        <select name="gender" defaultValue={equity.gender || ''} disabled={busy}>
                          <option value="">Prefer not to say</option>
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                        </select>
                      </label>
                      <label>
                        Residency
                        <select name="nationality_group" defaultValue={equity.nationality_group || ''} disabled={busy}>
                          <option value="">Prefer not to say</option>
                          <option value="UAE National">UAE National</option>
                          <option value="Expatriate resident">Expatriate resident</option>
                        </select>
                      </label>
                      <label>
                        Preferred language
                        <select name="language" defaultValue={equity.language || ''} disabled={busy}>
                          <option value="">Prefer not to say</option>
                          <option value="Arabic">Arabic</option>
                          <option value="English">English</option>
                        </select>
                      </label>
                      <label>
                        Region
                        <select name="geography" defaultValue={equity.geography || ''} disabled={busy}>
                          <option value="">Prefer not to say</option>
                          <option value="Abu Dhabi City">Abu Dhabi City</option>
                          <option value="Al Ain">Al Ain</option>
                          <option value="Al Dhafra">Al Dhafra</option>
                        </select>
                      </label>
                    </div>
                    <div>
                      <Button type="submit" className="button-secondary" disabled={busy}>
                        Save optional preferences
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="consent-item">
                  <h3>Your data autonomy</h3>
                  <p className="muted">Permanently erase your saved screening assessments, referrals, and comorbidity context.</p>
                  {!confirmErase ? (
                    <Button className="button-secondary" disabled={busy} onClick={() => setConfirmErase(true)}>
                      Erase my wellbeing records
                    </Button>
                  ) : (
                    <div className="notice" role="alert">
                      <strong>Confirm erasure</strong>
                      <p>This permanently deletes your assessments, referrals, and comorbidity context from this workspace.</p>
                      <div className="actions">
                        <Button disabled={busy} onClick={handleErase}>
                          {busy ? 'Erasing…' : 'Yes, erase my records'}
                        </Button>
                        <Button className="button-secondary" disabled={busy} onClick={() => setConfirmErase(false)}>
                          Keep my records
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {message && (
              <p className="notice" role="status">
                {message}
              </p>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
