import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { assessmentOptions, assessmentStem, instrumentNotice, instruments } from '../data/instruments'
import { saveAssessment } from '../services/assessmentService'
import Button from '../components/Button'

export default function Assessment() {
  const { user } = useAuth()
  const [instrumentId, setInstrumentId] = useState(null)
  const [answers, setAnswers] = useState([])
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const question = useRef(null)
  const navigate = useNavigate()
  const instrument = instruments[instrumentId]
  useEffect(() => { question.current?.focus() }, [step, instrumentId])

  function choose(id) {
    setInstrumentId(id); setAnswers(Array(instruments[id].items.length).fill(null)); setStep(0); setError('')
  }
  async function next(event) {
    event.preventDefault()
    if (answers[step] === null) return setError('Please choose an answer before continuing.')
    setError('')
    if (step < instrument.items.length - 1) return setStep(step + 1)
    setBusy(true)
    try {
      const saved = await saveAssessment(user.id, instrumentId, answers)
      navigate(`/results/${saved.id}`)
    } catch (error) { setError(error.message || 'Unable to save your assessment. Please try again.') }
    finally { setBusy(false) }
  }
  return <section className="page-intro"><p className="eyebrow">A MOMENT TO CHECK IN</p><h1>Your wellbeing, at your pace</h1><p>Participation is voluntary. These screening tools reflect your experiences over the last two weeks; they do not provide a diagnosis. You can leave at any time. Answers are saved only when you submit.</p>
    {!instrument ? <div className="assessment-choices">{Object.entries(instruments).map(([id, tool]) => <article className="card" key={id}><h2>{tool.name}: {tool.focus}</h2><p>{tool.items.length} questions about your {tool.focus}.</p><Button onClick={() => choose(id)}>Choose {tool.name}</Button></article>)}</div> : <div className="card">
      <p role="status">{instrument.name} · Question {step + 1} of {instrument.items.length}</p><progress aria-label="Assessment progress" value={step + 1} max={instrument.items.length} />
      <p>{assessmentStem}</p><form onSubmit={next}><fieldset key={`${instrumentId}-${step}`} disabled={busy} className="question-group"><legend ref={question} tabIndex={-1}>{step + 1}. {instrument.items[step]}</legend>
        {assessmentOptions.map((label, value) => <label className="radio-option" key={value}><input type="radio" name="answer" value={value} required checked={answers[step] === value} onChange={() => setAnswers(previous => previous.map((answer, index) => index === step ? value : answer))} />{label}</label>)}
      </fieldset>{error && <p className="error" role="alert">{error}</p>}<div className="actions"><Button className="button-secondary" disabled={busy} onClick={() => { setError(''); if (step === 0) setInstrumentId(null); else setStep(step - 1) }}>Back</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : step === instrument.items.length - 1 ? 'Submit assessment' : 'Next'}</Button></div></form>
      <p className="muted">{instrumentNotice} <a href={instrument.source} target="_blank" rel="noreferrer">Official questionnaire</a></p>
    </div>}
  </section>
}
