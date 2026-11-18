import { supabase } from '../lib/supabase'

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

export async function getConsentRecords(userId) {
  const { data, error } = await client().from('consents').select('consent_type, granted, updated_at').eq('user_id', userId)
  if (error) throw error
  return data
}

export async function getConsents(userId) {
  const rows = await getConsentRecords(userId)
  return Object.fromEntries(rows.map(row => [row.consent_type, row.granted]))
}

export async function setConsent(userId, type, granted) {
  const { error } = await client().from('consents').upsert({ user_id: userId, consent_type: type, granted, updated_at: new Date().toISOString() }, { onConflict: 'user_id,consent_type' })
  if (error) throw error
}

export async function withdrawSharing(userId, type) {
  if (!['share_results', 'share_contact'].includes(type)) throw new Error('Choose an optional sharing preference.')
  // Updates all non-terminal (cancellable) referrals. 'follow_up_completed' is
  // terminal and intentionally excluded — sharing for completed referrals is not retracted.
  const { error } = await client().from('referrals').update({ [type]: false }).eq('user_id', userId).in('status', ['pending', 'accepted', 'appointment_scheduled'])
  if (error) throw error
  await setConsent(userId, type, false)
}
