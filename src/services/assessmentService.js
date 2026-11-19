import { supabase } from '../lib/supabase'
import { scoreAssessment } from '../data/instruments'
import { appendDemoAudit, demoGenerateId, loadDemoDb, saveDemoDb } from '../lib/demoStore'

async function shouldRetainHistory(userId, explicitFlag) {
  if (typeof explicitFlag === 'boolean') return explicitFlag
  if (!supabase) {
    const db = loadDemoDb()
    const row = db.consents.find(c => c.user_id === userId && c.consent_type === 'retain_history')
    return row ? row.granted !== false : true
  }
  const { data } = await supabase
    .from('consents')
    .select('granted')
    .eq('user_id', userId)
    .eq('consent_type', 'retain_history')
    .maybeSingle()
  return data ? data.granted !== false : true
}

export async function saveAssessment(userId, instrumentId, answers, extras = {}) {
  const { total, severity } = scoreAssessment(instrumentId, answers)
  const functioning = Number.isInteger(extras.functioning) ? extras.functioning : null
  const optInSignals = Array.isArray(extras.optInSignals) ? extras.optInSignals : []
  const retain = await shouldRetainHistory(userId, extras.retainHistory)

  if (!retain) {
    return {
      id: 'ephemeral',
      ephemeral: true,
      user_id: userId,
      instrument: instrumentId,
      total_score: total,
      severity,
      answers: [...answers],
      functioning,
      opt_in_signals: optInSignals,
      created_at: new Date().toISOString(),
    }
  }

  if (!supabase) {
    const db = loadDemoDb()
    const record = {
      id: demoGenerateId('assess'),
      user_id: userId,
      instrument: instrumentId,
      total_score: total,
      severity,
      answers: [...answers],
      functioning,
      opt_in_signals: optInSignals,
      created_at: new Date().toISOString(),
    }
    db.assessments.unshift(record)
    appendDemoAudit(db, userId, 'INSERT', 'assessments', record.id)
    saveDemoDb(db)
    return record
  }

  const { data, error } = await supabase
    .from('assessments')
    .insert({
      user_id: userId,
      instrument: instrumentId,
      total_score: total,
      severity,
      answers,
      functioning,
      opt_in_signals: optInSignals,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listAssessments(userId) {
  if (!supabase) {
    const db = loadDemoDb()
    return db.assessments
      .filter(row => row.user_id === userId)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  }
  const { data, error } = await supabase
    .from('assessments')
    .select('id, instrument, total_score, severity, functioning, opt_in_signals, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAssessment(userId, id) {
  if (!supabase) {
    const db = loadDemoDb()
    return db.assessments.find(row => row.user_id === userId && row.id === id) || null
  }
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}
