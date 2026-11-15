import { supabase } from '../lib/supabase'
import { STATUS, isActiveReferral } from './referralService'

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

export function filterReferrals(referrals, filter) {
  return referrals.filter(referral => filter === 'all' || (filter === 'active' ? isActiveReferral(referral) : STATUS[referral.status]?.terminal === true))
}

export function allowedStatuses(referral, professionalId) {
  return referral.user_id === professionalId ? [] : Object.keys(STATUS).filter(status => status !== 'cancelled')
}

export async function listAssignedReferrals(professionalId) {
  const { data, error } = await client().from('referrals').select('*, service:support_services(name, tier), follow_ups(*)').eq('professional_id', professionalId).order('created_at', { ascending: false })
  if (error) throw error
  return Promise.all(data.map(async referral => {
    let profile = null
    let assessments = []
    if (referral.share_contact) {
      const result = await client().from('profiles').select('full_name').eq('id', referral.user_id).maybeSingle()
      if (result.error) throw result.error
      profile = result.data
    }
    if (referral.share_results) {
      const result = await client().from('assessments').select('instrument, total_score, severity, created_at').eq('user_id', referral.user_id).order('created_at', { ascending: false })
      if (result.error) throw result.error
      assessments = ['PHQ9', 'GAD7'].map(instrument => result.data.find(row => row.instrument === instrument)).filter(Boolean)
    }
    return { ...referral, profile, assessments, follow_ups: [...referral.follow_ups].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)) }
  }))
}

export async function updateReferralStatus(id, status) {
  if (!Object.hasOwn(STATUS, status) || status === 'cancelled') throw new Error('Choose a permitted professional status.')
  const { data, error } = await client().from('referrals').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function addFollowUp(referralId, note, outcome) {
  if (!note.trim() && !outcome.trim()) throw new Error('Enter a note or outcome.')
  const { data, error } = await client().from('follow_ups').insert({ referral_id: referralId, note: note.trim() || null, outcome: outcome.trim() || null }).select().single()
  if (error) throw error
  return data
}
