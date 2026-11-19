import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useI18n } from '../context/i18n'
import { setConsent, updateEquityProfile, withdrawSharing } from '../services/consentService'
import Button from '../components/Button'

export default function Consent() {
  const { user, profile, consents, consentsLoading, consentError, refreshConsents, refreshProfile } = useAuth()
  const { lang } = useI18n()
  const isAr = lang === 'ar'
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function submit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!data.has('terms')) return setError('Please confirm that you understand and agree to continue.')
    setBusy(true)
    setError('')
    try {
      for (const type of ['retain_history', 'share_results', 'share_contact', 'share_physical_context', 'research_opt_in']) {
        if (data.has(type)) await setConsent(user.id, type, true)
        else await withdrawSharing(user.id, type)
      }
      await updateEquityProfile(user.id, {
        age_group: data.get('age_group') || '',
        gender: data.get('gender') || '',
        nationality_group: data.get('nationality_group') || '',
        language: data.get('language') || '',
        geography: data.get('geography') || '',
      })
      await setConsent(user.id, 'terms', true)
      await Promise.all([refreshConsents(), refreshProfile()])
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(`${err.message || 'Unable to save preferences.'} Some changes may have saved. Please try again.`)
    } finally {
      setBusy(false)
    }
  }

  const equity = profile?.equity || {}

  return (
    <section className="page-intro">
      <p className="eyebrow">{isAr ? 'خياراتك في كل خطوة' : 'YOUR CHOICE, AT EVERY STEP'}</p>
      <h1>{isAr ? 'الموافقة المستنيرة وتفضيلات الخصوصية' : 'Consent & privacy preferences'}</h1>
      <div className="card">
        <p>
          {isAr
            ? 'أدوات الفحص في MindBridge AI طوعية وليست تشخيصاً طبياً. تبقى القرارات السريرية بيد المختصين المرخصين.'
            : 'Assessments are voluntary screening tools, not a medical diagnosis. Licensed healthcare professionals remain the final decision makers.'}
        </p>
        <p>
          <strong>Data minimisation &amp; employer protection:</strong> Identifiable wellbeing scores, questionnaire responses, and clinical notes are <strong>never</strong> disclosed to employers, HR, insurers, or unauthorized third parties.
        </p>

        {consentsLoading ? (
          <p role="status">Loading your preferences…</p>
        ) : (
          <form key={`${user.id}-${JSON.stringify(equity)}`} className="consent-form" onSubmit={submit}>
            {consentError && (
              <p className="error" role="alert">
                {consentError} You can retry saving your choices below.
              </p>
            )}

            <label className="check-label">
              <input type="checkbox" name="terms" required defaultChecked={consents.terms === true} disabled={busy} />
              <span>
                <strong>1. Completing assessments (required):</strong> I understand MindBridge AI is a voluntary screening &amp; navigation platform, not a diagnostic or emergency service.
              </span>
            </label>

            <label className="check-label">
              <input type="checkbox" name="retain_history" defaultChecked={consents.retain_history !== false} disabled={busy} />
              <span>
                <strong>2. Retaining personal assessment history (optional):</strong> Save my scores over time so I can recognise wellbeing changes. <em>If off, trend tracking is disabled.</em>
              </span>
            </label>

            <label className="check-label">
              <input type="checkbox" name="share_results" defaultChecked={consents.share_results === true} disabled={busy} />
              <span>
                <strong>3a. Sharing assessment results for referrals (optional):</strong> Allow assigned clinicians to view my screening scores when I request a referral.
              </span>
            </label>

            <label className="check-label">
              <input type="checkbox" name="share_contact" defaultChecked={consents.share_contact === true} disabled={busy} />
              <span>
                <strong>3b. Sharing name/contact for referrals (optional):</strong> Allow assigned clinicians or care coordinators to see my contact name to schedule care.
              </span>
            </label>

            <label className="check-label">
              <input type="checkbox" name="share_physical_context" defaultChecked={consents.share_physical_context === true} disabled={busy} />
              <span>
                <strong>4. Sharing physical healthcare context (optional):</strong> Allow authorised primary-care and mental health clinicians to coordinate physical &amp; mental health context.
              </span>
            </label>

            <label className="check-label">
              <input type="checkbox" name="research_opt_in" defaultChecked={consents.research_opt_in === true} disabled={busy} />
              <span>
                <strong>5. De-identified population health &amp; fairness analytics (optional):</strong> Include my strictly de-identified metrics (with small-group suppression) to improve Abu Dhabi waiting times and equity.
              </span>
            </label>

            <div className="consent-item">
              <h3>Optional fairness &amp; language preferences (de-identified)</h3>
              <p className="muted">
                Used only in aggregated, small-cell-suppressed reports to detect language or geographic waiting-time gaps. You may leave all blank.
              </p>
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
            </div>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : isAr ? 'حفظ والمتابعة' : 'Save & continue'}
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
