import { supabase } from '../lib/supabase'
import { appendDemoAudit, loadDemoDb, saveDemoDb } from '../lib/demoStore'

export const OPTIONAL_SHARING_TYPES = [
  'retain_history',
  'share_results',
  'share_contact',
  'share_physical_context',
  'research_opt_in',
]

function isDemo() {
  return !supabase
}

export async function getConsentRecords(userId) {
  if (isDemo()) {
    const db = loadDemoDb()
    return db.consents.filter(row => row.user_id === userId)
  }
  const { data, error } = await supabase.from('consents').select('consent_type, granted, updated_at').eq('user_id', userId)
  if (error) throw error
  return data
}

export async function getConsents(userId) {
  const rows = await getConsentRecords(userId)
  return Object.fromEntries(rows.map(row => [row.consent_type, row.granted]))
}

export async function setConsent(userId, type, granted) {
  if (isDemo()) {
    const db = loadDemoDb()
    const now = new Date().toISOString()
    const existing = db.consents.find(row => row.user_id === userId && row.consent_type === type)
    if (existing) {
      existing.granted = Boolean(granted)
      existing.updated_at = now
    } else {
      db.consents.push({ user_id: userId, consent_type: type, granted: Boolean(granted), updated_at: now })
    }
    appendDemoAudit(db, userId, 'CONSENT_UPDATED', 'consents', userId)
    saveDemoDb(db)
    return
  }
  const { error } = await supabase
    .from('consents')
    .upsert({ user_id: userId, consent_type: type, granted: Boolean(granted), updated_at: new Date().toISOString() }, { onConflict: 'user_id,consent_type' })
  if (error) throw error
}

export async function withdrawSharing(userId, type) {
  if (!OPTIONAL_SHARING_TYPES.includes(type)) throw new Error('Choose an optional sharing preference.')
  const activeStatuses = ['support_requested', 'submitted', 'received', 'professional_review', 'appointment_scheduled', 'escalated', 'pending', 'accepted']
  if (isDemo()) {
    const db = loadDemoDb()
    if (['share_results', 'share_contact', 'share_physical_context'].includes(type)) {
      db.referrals.forEach(referral => {
        if (referral.user_id === userId && activeStatuses.includes(referral.status)) {
          referral[type] = false
          referral.updated_at = new Date().toISOString()
        }
      })
    }
    saveDemoDb(db)
    await setConsent(userId, type, false)
    return
  }
  if (['share_results', 'share_contact', 'share_physical_context'].includes(type)) {
    const { error } = await supabase
      .from('referrals')
      .update({ [type]: false })
      .eq('user_id', userId)
      .in('status', activeStatuses)
    if (error) throw error
  }
  await setConsent(userId, type, false)
}

export async function updatePhysicalContext(userId, physicalContext) {
  const normalized = {
    conditions: Array.isArray(physicalContext?.conditions) ? physicalContext.conditions : [],
    primary_care_note: physicalContext?.primary_care_note?.trim() || '',
    medications_note: physicalContext?.medications_note?.trim() || '',
    malaffi_simulated: physicalContext?.malaffi_simulated || null,
    updated_at: new Date().toISOString(),
  }
  if (isDemo()) {
    const db = loadDemoDb()
    const user = db.users.find(item => item.id === userId)
    if (!user) throw new Error('User profile not found.')
    user.physical_context = {
      ...normalized,
      malaffi_simulated: user.physical_context?.malaffi_simulated || normalized.malaffi_simulated,
    }
    appendDemoAudit(db, userId, 'UPDATE_PHYSICAL_CONTEXT', 'profiles', userId)
    saveDemoDb(db)
    return user.physical_context
  }
  const { error } = await supabase.from('profiles').update({ physical_context: normalized }).eq('id', userId)
  if (error) throw error
  return normalized
}

export async function updateEquityProfile(userId, equity) {
  const normalized = {
    age_group: equity?.age_group || '',
    gender: equity?.gender || '',
    nationality_group: equity?.nationality_group || '',
    language: equity?.language || '',
    geography: equity?.geography || '',
  }
  if (isDemo()) {
    const db = loadDemoDb()
    const user = db.users.find(item => item.id === userId)
    if (!user) throw new Error('User profile not found.')
    user.equity = normalized
    saveDemoDb(db)
    return normalized
  }
  const { error } = await supabase.from('profiles').update({ equity: normalized }).eq('id', userId)
  if (error) throw error
  return normalized
}

export async function eraseMyWellbeingData(userId) {
  if (isDemo()) {
    const db = loadDemoDb()
    db.assessments = db.assessments.filter(item => item.user_id !== userId)
    const userReferralIds = new Set(db.referrals.filter(item => item.user_id === userId).map(item => item.id))
    db.referrals = db.referrals.filter(item => item.user_id !== userId)
    db.follow_ups = db.follow_ups.filter(item => !userReferralIds.has(item.referral_id))
    const user = db.users.find(item => item.id === userId)
    if (user) {
      user.physical_context = null
      user.equity = {}
    }
    db.consents.forEach(item => {
      if (item.user_id === userId && item.consent_type !== 'terms') {
        item.granted = false
        item.updated_at = new Date().toISOString()
      }
    })
    appendDemoAudit(db, userId, 'USER_ERASED_DATA', 'profiles', userId)
    saveDemoDb(db)
    return
  }

  const { error: refErr } = await supabase.from('referrals').delete().eq('user_id', userId)
  if (refErr) throw refErr
  const { error: asmErr } = await supabase.from('assessments').delete().eq('user_id', userId)
  if (asmErr) throw asmErr
  const { error: profErr } = await supabase.from('profiles').update({ physical_context: null, equity: {} }).eq('id', userId)
  if (profErr) throw profErr
  for (const type of OPTIONAL_SHARING_TYPES) {
    await setConsent(userId, type, false)
  }
}
