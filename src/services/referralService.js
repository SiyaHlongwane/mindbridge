import { supabase } from '../lib/supabase'

export const STATUS = {
  pending: { label: 'Pending', description: 'Your request is waiting for a response.', terminal: false },
  accepted: { label: 'Accepted', description: 'Your referral has been accepted.', terminal: false },
  appointment_scheduled: { label: 'Appointment scheduled', description: 'An appointment has been arranged.', terminal: false },
  follow_up_completed: { label: 'Follow-up completed', description: 'Follow-up has been completed for this referral.', terminal: true /* terminal: sharing withdrawal and cancel no longer apply */ },
  declined: { label: 'Declined', description: 'This service could not accept your referral. Other options are available.', terminal: true },
  cancelled: { label: 'Cancelled', description: 'This referral has been cancelled.', terminal: true },
  unable_to_contact: { label: 'Unable to contact', description: 'Contact could not be established. You can explore other options.', terminal: true },
}
export const HAPPY_PATH = ['pending', 'accepted', 'appointment_scheduled', 'follow_up_completed']
export const CANCELLABLE_STATUSES = ['pending', 'accepted', 'appointment_scheduled']
export const pendingReminder = 'No response yet. You can wait, contact the service directly, or explore alternatives.'

export function isActiveReferral(referral) {
  return Object.hasOwn(STATUS, referral.status) && !STATUS[referral.status].terminal
}

export function needsReminder(referral, now = Date.now()) {
  return referral.status === 'pending' && now - Date.parse(referral.created_at) >= 7 * 24 * 60 * 60 * 1000
}

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

const referralFields = '*, service:support_services(name, tier)'

export async function createReferral({ serviceId, shareResults, shareContact, userNote }) {
  const { data, error } = await client().from('referrals').insert({ service_id: serviceId, status: 'pending', share_results: Boolean(shareResults), share_contact: Boolean(shareContact), user_note: userNote?.trim() || null }).select(referralFields).single()
  if (error?.code === '23505') throw new Error('You already have an active referral to this service')
  if (error) throw error
  return data
}

export async function listMyReferrals(userId) {
  const { data, error } = await client().from('referrals').select(referralFields).eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getReferral(id) {
  const { data, error } = await client().from('referrals').select(`${referralFields}, follow_ups(*)`).eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  return { ...data, follow_ups: [...data.follow_ups].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)) }
}

export async function cancelReferral(id) {
  const { data, error } = await client().from('referrals')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .in('status', CANCELLABLE_STATUSES)
    .select(referralFields)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('This referral cannot be cancelled. It may have already ended or been updated.')
  return data
}
