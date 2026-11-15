import { supabase } from '../lib/supabase'
import { scoreAssessment } from '../data/instruments'

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

export async function saveAssessment(userId, instrumentId, answers) {
  const { total, severity } = scoreAssessment(instrumentId, answers)
  const { data, error } = await client().from('assessments').insert({ user_id: userId, instrument: instrumentId, total_score: total, severity, answers }).select().single()
  if (error) throw error
  return data
}

export async function listAssessments(userId) {
  const { data, error } = await client().from('assessments').select('id, instrument, total_score, severity, created_at').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAssessment(userId, id) {
  const { data, error } = await client().from('assessments').select('*').eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}
