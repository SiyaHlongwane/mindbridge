import { supabase } from '../lib/supabase'
import { appendDemoAudit, demoGenerateId, loadDemoDb, saveDemoDb } from '../lib/demoStore'

export const STATUS = {
  support_requested: { label: 'Support requested', description: 'You started a request for support.', terminal: false },
  submitted: { label: 'Referral submitted', description: 'Your referral has been submitted into the care queue.', terminal: false },
  received: { label: 'Referral received', description: 'The care team has received your referral.', terminal: false },
  professional_review: { label: 'Professional review', description: 'A licensed healthcare professional is reviewing your request.', terminal: false },
  appointment_scheduled: { label: 'Appointment scheduled', description: 'An appointment or tele-mental health session has been scheduled.', terminal: false },
  appointment_attended: { label: 'Appointment attended', description: 'Your appointment took place; follow-up is being recorded.', terminal: false },
  follow_up_completed: { label: 'Follow-up completed', description: 'Follow-up and outcome review have been completed.', terminal: true },
  escalated: { label: 'Escalated (Urgent human review)', description: 'Routed to urgent human escalation with 24-hour safety priority.', terminal: false },
  declined: { label: 'Declined', description: 'This service could not accept your referral. Alternative options are available.', terminal: true },
  cancelled: { label: 'Cancelled', description: 'This referral has been cancelled.', terminal: true },
  unsuccessful_handover: { label: 'Unsuccessful handover', description: 'Handover could not be completed. Coordinator follow-up or alternative options are available.', terminal: true },
  pending: { label: 'Pending', description: 'Your referral is waiting for clinician review.', terminal: false },
  accepted: { label: 'Accepted', description: 'A licensed professional has accepted your referral.', terminal: false },
  unable_to_contact: { label: 'Unable to contact', description: 'Contact could not be established. You can explore other options.', terminal: true },
}

export const HAPPY_PATH = [
  'submitted',
  'received',
  'professional_review',
  'appointment_scheduled',
  'appointment_attended',
  'follow_up_completed',
]

export const CANCELLABLE_STATUSES = [
  'support_requested',
  'submitted',
  'received',
  'professional_review',
  'appointment_scheduled',
  'escalated',
  'pending',
  'accepted',
]

export const pendingReminder = 'No response yet beyond the expected window. You can wait, contact the service directly, or explore tele-mental health / alternatives.'

export const SLA_HOURS = {
  urgent: 24,
  routine: 168,
}

export function isActiveReferral(referral) {
  return Object.hasOwn(STATUS, referral.status) && !STATUS[referral.status].terminal
}

export function needsReminder(referral, now = Date.now()) {
  const limitMs = (referral.priority === 'urgent' ? SLA_HOURS.urgent : SLA_HOURS.routine) * 60 * 60 * 1000
  return ['support_requested', 'submitted', 'received', 'pending'].includes(referral.status) && now - Date.parse(referral.created_at) >= limitMs
}

const referralFields = '*, service:support_services(name, tier, typical_wait, delivery_mode)'

function hydrateDemoReferral(db, referral, includeFollowUps = false) {
  const service = db.support_services.find(item => item.id === referral.service_id) || null
  const result = {
    ...referral,
    service: service ? { name: service.name, tier: service.tier, typical_wait: service.typical_wait, delivery_mode: service.delivery_mode } : null,
  }
  if (includeFollowUps) {
    result.follow_ups = db.follow_ups
      .filter(item => item.referral_id === referral.id)
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
  }
  return result
}

export async function createReferral({ userId, serviceId, shareResults, shareContact, sharePhysicalContext, userNote, priority = 'routine', crisisFlagged = false, appointmentMode = '' }) {
  const safePriority = priority === 'urgent' || crisisFlagged ? 'urgent' : 'routine'
  if (!supabase) {
    const db = loadDemoDb()
    const duplicate = db.referrals.find(r =>
      r.user_id === userId &&
      r.service_id === serviceId &&
      !['declined', 'follow_up_completed', 'cancelled', 'unsuccessful_handover', 'unable_to_contact'].includes(r.status)
    )
    if (duplicate) throw new Error('You already have an active referral to this service')

    const serviceObj = db.support_services.find(s => s.id === serviceId)
    const isUrgent = Boolean(crisisFlagged || priority === 'urgent' || serviceObj?.tier === 'urgent_emergency')
    const resolvedPriority = isUrgent ? 'urgent' : safePriority

    const professionals = db.users.filter(u => u.role === 'professional' && u.id !== userId)
    const assigned = professionals
      .sort((a, b) => {
        const countA = db.referrals.filter(r => r.professional_id === a.id && isActiveReferral(r)).length
        const countB = db.referrals.filter(r => r.professional_id === b.id && isActiveReferral(r)).length
        return countA - countB
      })[0]

    const now = new Date().toISOString()
    const record = {
      id: demoGenerateId('ref'),
      user_id: userId,
      service_id: serviceId,
      professional_id: assigned?.id || null,
      status: isUrgent ? 'escalated' : 'submitted',
      priority: resolvedPriority,
      crisis_flagged: isUrgent,
      crisis_acknowledged_at: null,
      crisis_completed_at: null,
      first_response_at: null,
      appointment_at: null,
      appointment_mode: appointmentMode || (isUrgent ? 'Urgent clinician outreach' : 'To be scheduled'),
      attendance_status: 'pending',
      share_results: Boolean(shareResults),
      share_contact: Boolean(shareContact),
      share_physical_context: Boolean(sharePhysicalContext),
      user_note: userNote?.trim() || null,
      feedback: null,
      created_at: now,
      updated_at: now,
    }
    db.referrals.unshift(record)
    appendDemoAudit(db, userId, isUrgent ? 'URGENT_REFERRAL_ESCALATED' : 'REFERRAL_SUBMITTED', 'referrals', record.id)
    saveDemoDb(db)
    return hydrateDemoReferral(db, record, true)
  }

  const { data: svc } = await supabase.from('support_services').select('tier').eq('id', serviceId).maybeSingle()
  const isUrgent = Boolean(crisisFlagged || priority === 'urgent' || svc?.tier === 'urgent_emergency')

  const { data, error } = await supabase
    .from('referrals')
    .insert({
      service_id: serviceId,
      status: isUrgent ? 'escalated' : 'submitted',
      priority: isUrgent ? 'urgent' : 'routine',
      crisis_flagged: isUrgent,
      appointment_mode: appointmentMode || (isUrgent ? 'Urgent clinician outreach' : 'To be scheduled'),
      attendance_status: 'pending',
      share_results: Boolean(shareResults),
      share_contact: Boolean(shareContact),
      share_physical_context: Boolean(sharePhysicalContext),
      user_note: userNote?.trim() || null,
    })
    .select(referralFields)
    .single()
  if (error?.code === '23505') throw new Error('You already have an active referral to this service')
  if (error) throw error
  return data
}

export async function listMyReferrals(userId) {
  if (!supabase) {
    const db = loadDemoDb()
    return db.referrals
      .filter(r => r.user_id === userId)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .map(r => hydrateDemoReferral(db, r, false))
  }
  const { data, error } = await supabase.from('referrals').select(referralFields).eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getReferral(id) {
  if (!supabase) {
    const db = loadDemoDb()
    const referral = db.referrals.find(r => r.id === id)
    return referral ? hydrateDemoReferral(db, referral, true) : null
  }
  const { data, error } = await supabase.from('referrals').select(`${referralFields}, follow_ups(*)`).eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  return { ...data, follow_ups: [...data.follow_ups].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)) }
}

export async function cancelReferral(id) {
  if (!supabase) {
    const db = loadDemoDb()
    const referral = db.referrals.find(r => r.id === id)
    if (!referral) throw new Error('Referral not found.')
    if (!CANCELLABLE_STATUSES.includes(referral.status)) {
      throw new Error('This referral cannot be cancelled. It may have already ended or been updated.')
    }
    referral.status = 'cancelled'
    referral.updated_at = new Date().toISOString()
    appendDemoAudit(db, referral.user_id, 'CANCEL', 'referrals', referral.id)
    saveDemoDb(db)
    return hydrateDemoReferral(db, referral, true)
  }
  const { data, error } = await supabase
    .from('referrals')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .in('status', CANCELLABLE_STATUSES)
    .select(referralFields)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('This referral cannot be cancelled. It may have already ended or been updated.')
  return data
}

export async function submitReferralFeedback(referralId, rating, comment) {
  const safeRating = Number(rating)
  if (!Number.isInteger(safeRating) || safeRating < 1 || safeRating > 5) {
    throw new Error('Select a rating between 1 and 5.')
  }
  const payload = {
    rating: safeRating,
    comment: comment?.trim() || '',
    created_at: new Date().toISOString(),
  }
  if (!supabase) {
    const db = loadDemoDb()
    const referral = db.referrals.find(r => r.id === referralId)
    if (!referral) throw new Error('Referral not found.')
    referral.feedback = payload
    referral.updated_at = new Date().toISOString()
    appendDemoAudit(db, referral.user_id, 'FEEDBACK_SUBMITTED', 'referrals', referralId)
    saveDemoDb(db)
    return referral.feedback
  }
  const { data, error } = await supabase.from('referrals').update({ feedback: payload }).eq('id', referralId).select('feedback').single()
  if (error) throw error
  return data.feedback
}
