import { supabase } from '../lib/supabase'
import { SLA_HOURS, STATUS } from './referralService'
import { TIERS } from './supportService'
import { appendDemoAudit, demoGenerateId, loadDemoDb, saveDemoDb } from '../lib/demoStore'

export const SMALL_CELL_THRESHOLD = 3

const ALL_ROLES = ['individual', 'professional', 'primary_care', 'coordinator', 'admin', 'analyst']

async function countRows(table, column, value) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  if (column) query = query.eq(column, value)
  const { count, error } = await query
  if (error) throw error
  return count
}

export async function getAdminMetrics() {
  const statuses = Object.keys(STATUS)
  if (!supabase) {
    const db = loadDemoDb()
    return {
      users: Object.fromEntries(ALL_ROLES.map(role => [role, db.users.filter(u => u.role === role).length])),
      assessments: db.assessments.length,
      referrals: Object.fromEntries(statuses.map(status => [status, db.referrals.filter(r => r.status === status).length])),
      followUps: db.follow_ups.length,
    }
  }
  const [users, assessments, referrals, followUps] = await Promise.all([
    Promise.all(ALL_ROLES.map(role => countRows('profiles', 'role', role))),
    countRows('assessments'),
    Promise.all(statuses.map(status => countRows('referrals', 'status', status))),
    countRows('follow_ups'),
  ])
  return {
    users: Object.fromEntries(ALL_ROLES.map((role, index) => [role, users[index]])),
    assessments,
    referrals: Object.fromEntries(statuses.map((status, index) => [status, referrals[index]])),
    followUps,
  }
}

export async function listUsersAndRoles() {
  if (!supabase) {
    const db = loadDemoDb()
    return db.users.map(u => ({ id: u.id, full_name: u.full_name, email: u.email, role: u.role, created_at: u.created_at }))
  }
  const { data, error } = await supabase.from('profiles').select('id, email, full_name, role, created_at').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateUserRole(targetUserId, newRole, actorId) {
  if (!ALL_ROLES.includes(newRole)) throw new Error('Choose a valid role.')
  if (!supabase) {
    const db = loadDemoDb()
    const user = db.users.find(u => u.id === targetUserId)
    if (!user) throw new Error('User not found.')
    user.role = newRole
    appendDemoAudit(db, actorId || 'admin', 'ROLE_UPDATED', 'profiles', targetUserId)
    saveDemoDb(db)
    return user
  }
  const { data, error } = await supabase.from('profiles').update({ role: newRole }).eq('id', targetUserId).select().single()
  if (error) throw error
  return data
}

export async function listAdminServices() {
  if (!supabase) {
    const db = loadDemoDb()
    return [...db.support_services].sort((a, b) => a.name.localeCompare(b.name))
  }
  const { data, error } = await supabase.from('support_services').select('*').order('name')
  if (error) throw error
  return data
}

export async function listAdminReferrals() {
  if (!supabase) {
    const db = loadDemoDb()
    return [...db.referrals]
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .map(r => {
        const service = db.support_services.find(s => s.id === r.service_id)
        const owner = db.users.find(u => u.id === r.user_id)
        const geography = owner?.equity?.geography || 'Unspecified'
        return {
          id: r.id,
          user_id: r.user_id,
          status: r.status,
          priority: r.priority || 'routine',
          crisis_flagged: Boolean(r.crisis_flagged),
          created_at: r.created_at,
          service: service ? { name: service.name } : null,
          reference_label: `Ref #${r.id.slice(-6)} · ${geography}`,
        }
      })
  }
  const { data, error } = await supabase
    .from('referrals')
    .select('id, user_id, status, priority, crisis_flagged, created_at, service:support_services(name), user:profiles!referrals_user_id_fkey(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function acceptAdminReferral(id) {
  const now = new Date().toISOString()
  if (!supabase) {
    const db = loadDemoDb()
    const referral = db.referrals.find(r => r.id === id && ['support_requested', 'pending', 'submitted', 'received'].includes(r.status))
    if (!referral) throw new Error('This referral is no longer waiting.')
    referral.status = 'professional_review'
    if (!referral.first_response_at) referral.first_response_at = now
    referral.updated_at = now
    appendDemoAudit(db, 'admin', 'ACCEPT_REFERRAL', 'referrals', id)
    saveDemoDb(db)
    return
  }
  const { data, error } = await supabase
    .from('referrals')
    .update({ status: 'professional_review', first_response_at: now })
    .eq('id', id)
    .in('status', ['support_requested', 'pending', 'submitted', 'received'])
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('This referral is no longer waiting.')
}

export async function saveService(id, values) {
  const fields = {
    name: values.name.trim(),
    tier: values.tier,
    description: values.description.trim() || null,
    location: values.location?.trim() || 'Abu Dhabi',
    contact: values.contact.trim() || null,
    website: values.website.trim() || null,
    eligibility: values.eligibility?.trim() || 'Check eligibility at referral hand-off',
    languages: values.languages?.trim() || 'Arabic, English',
    operating_hours: values.operating_hours?.trim() || 'Sun–Thu 08:00–18:00',
    appointment_method: values.appointment_method?.trim() || 'MindBridge referral',
    delivery_mode: values.delivery_mode?.trim() || 'In-person / tele-health',
    typical_wait: values.typical_wait?.trim() || '2–5 days',
    availability: values.availability?.trim() || 'Available',
    geography: values.geography?.trim() || 'Abu Dhabi',
    last_verified_at: new Date().toISOString().slice(0, 10),
  }
  if (!fields.name) throw new Error('Enter a service name.')
  if (!TIERS.some(tier => tier.id === fields.tier)) throw new Error('Choose a support tier.')
  if (fields.website) {
    let url
    try { url = new URL(fields.website) } catch { throw new Error('Enter a full http or https website URL.') }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Enter a full http or https website URL.')
  }

  if (!supabase) {
    const db = loadDemoDb()
    if (id) {
      const existing = db.support_services.find(s => s.id === id)
      if (!existing) throw new Error('Service not found.')
      Object.assign(existing, fields)
      appendDemoAudit(db, 'admin', 'UPDATE', 'support_services', id)
      saveDemoDb(db)
      return existing
    }
    const created = {
      id: demoGenerateId('svc'),
      ...fields,
      verified: false,
      active: true,
      created_at: new Date().toISOString(),
    }
    db.support_services.push(created)
    appendDemoAudit(db, 'admin', 'INSERT', 'support_services', created.id)
    saveDemoDb(db)
    return created
  }

  const query = id ? supabase.from('support_services').update(fields).eq('id', id) : supabase.from('support_services').insert(fields)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function setServiceFlag(id, flag, value) {
  if (!['active', 'verified'].includes(flag) || typeof value !== 'boolean') throw new Error('Invalid service setting.')
  if (!supabase) {
    const db = loadDemoDb()
    const service = db.support_services.find(s => s.id === id)
    if (!service) throw new Error('Service not found.')
    service[flag] = value
    if (flag === 'verified' && value) service.last_verified_at = new Date().toISOString().slice(0, 10)
    appendDemoAudit(db, 'admin', 'UPDATE_FLAG', 'support_services', id)
    saveDemoDb(db)
    return service
  }
  const updates = { [flag]: value }
  if (flag === 'verified' && value) updates.last_verified_at = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase.from('support_services').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function listRecentAuditLogs() {
  if (!supabase) {
    const db = loadDemoDb()
    return db.audit_logs.slice(0, 50)
  }
  const { data, error } = await supabase.from('audit_logs').select('id, action, table_name, record_id, actor_id, created_at').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(50)
  if (error) throw error
  return data
}

function buildEquityGroupStats(dimension, users, referrals, positiveScreenUserIds) {
  const groups = new Map()
  users
    .filter(u => u.role === 'individual')
    .forEach(user => {
      const label = user.equity?.[dimension] || 'Not specified'
      if (!groups.has(label)) {
        groups.set(label, { label, users: 0, positiveUsers: 0, handoffs: 0, waitHours: [] })
      }
      const bucket = groups.get(label)
      bucket.users += 1
      if (positiveScreenUserIds.has(user.id)) bucket.positiveUsers += 1
      const userRefs = referrals.filter(r => r.user_id === user.id && r.status !== 'cancelled')
      const converted = userRefs.some(r => ['accepted', 'professional_review', 'appointment_scheduled', 'appointment_attended', 'follow_up_completed', 'escalated'].includes(r.status))
      if (converted) bucket.handoffs += 1
      userRefs.forEach(r => {
        if (r.first_response_at) {
          bucket.waitHours.push(Math.max(0, (Date.parse(r.first_response_at) - Date.parse(r.created_at)) / 3600000))
        }
      })
    })

  return Array.from(groups.values()).map(bucket => {
    const suppressed = bucket.users < SMALL_CELL_THRESHOLD
    const conversionRate = bucket.positiveUsers > 0 ? Math.round((bucket.handoffs / bucket.positiveUsers) * 100) : 0
    const avgWaitHours = bucket.waitHours.length > 0
      ? Math.round((bucket.waitHours.reduce((a, b) => a + b, 0) / bucket.waitHours.length) * 10) / 10
      : null
    return {
      group: bucket.label,
      suppressed,
      individuals: suppressed ? null : bucket.users,
      positiveScreens: suppressed ? null : bucket.positiveUsers,
      handoffs: suppressed ? null : bucket.handoffs,
      conversionRate: suppressed ? null : conversionRate,
      avgWaitHours: suppressed ? null : avgWaitHours,
    }
  })
}

function computeOutcomeDataset({ users, consents = [], assessments, referrals, followUps, services, adverseEvents, dateRangeDays }) {
  const optedInUserIds = new Set(
    consents
      .filter(c => c.consent_type === 'research_opt_in' && c.granted === true)
      .map(c => c.user_id)
  )

  const individuals = users.filter(u => u.role === 'individual' && optedInUserIds.has(u.id))
  const consentedIds = new Set(individuals.map(u => u.id))

  const cutoff = dateRangeDays > 0 ? Date.now() - dateRangeDays * 24 * 60 * 60 * 1000 : 0
  const filteredAssessments = assessments.filter(a => consentedIds.has(a.user_id) && Date.parse(a.created_at) >= cutoff)
  const filteredReferrals = referrals.filter(r => consentedIds.has(r.user_id) && Date.parse(r.created_at) >= cutoff)
  const filteredReferralIds = new Set(filteredReferrals.map(r => r.id))
  const filteredFollowUps = followUps.filter(f => filteredReferralIds.has(f.referral_id) && Date.parse(f.created_at) >= cutoff)

  const positiveScreenUserIds = new Set(
    filteredAssessments
      .filter(a => ['moderate', 'moderately severe', 'severe'].includes(a.severity) || (a.instrument === 'PHQ9' && a.answers?.[8] > 0))
      .map(a => a.user_id)
  )
  const convertedUserIds = new Set(
    filteredReferrals
      .filter(r => ['accepted', 'professional_review', 'appointment_scheduled', 'appointment_attended', 'follow_up_completed', 'escalated'].includes(r.status))
      .map(r => r.user_id)
  )
  const convertedCount = Array.from(positiveScreenUserIds).filter(uid => convertedUserIds.has(uid)).length
  const conversionRate = positiveScreenUserIds.size > 0 ? Math.round((convertedCount / positiveScreenUserIds.size) * 100) : 0

  const nonCancelledReferrals = filteredReferrals.filter(r => r.status !== 'cancelled')
  const completedReferrals = nonCancelledReferrals.filter(r => r.status === 'follow_up_completed').length
  const referralCompletionRate = nonCancelledReferrals.length > 0 ? Math.round((completedReferrals / nonCancelledReferrals.length) * 100) : 0

  const scheduledOrAttended = nonCancelledReferrals.filter(r => r.appointment_at || ['appointment_attended', 'follow_up_completed'].includes(r.status))
  const attendedCount = scheduledOrAttended.filter(r => r.attendance_status === 'attended' || ['appointment_attended', 'follow_up_completed'].includes(r.status)).length
  const attendanceRate = scheduledOrAttended.length > 0 ? Math.round((attendedCount / scheduledOrAttended.length) * 100) : 0

  const responseWaitHours = nonCancelledReferrals
    .filter(r => r.first_response_at)
    .map(r => Math.max(0, (Date.parse(r.first_response_at) - Date.parse(r.created_at)) / 3600000))
  const sortedWaits = [...responseWaitHours].sort((a, b) => a - b)
  const avgWaitHours = responseWaitHours.length > 0
    ? Math.round((responseWaitHours.reduce((a, b) => a + b, 0) / responseWaitHours.length) * 10) / 10
    : 0
  const medianWaitHours = sortedWaits.length > 0
    ? Math.round(sortedWaits[Math.floor(sortedWaits.length / 2)] * 10) / 10
    : 0

  const timelyCount = nonCancelledReferrals.filter(r => {
    const limitHours = r.priority === 'urgent' || r.crisis_flagged ? SLA_HOURS.urgent : SLA_HOURS.routine
    if (!r.first_response_at) return (Date.now() - Date.parse(r.created_at)) / 3600000 <= limitHours
    return (Date.parse(r.first_response_at) - Date.parse(r.created_at)) / 3600000 <= limitHours
  }).length
  const slaComplianceRate = nonCancelledReferrals.length > 0 ? Math.round((timelyCount / nonCancelledReferrals.length) * 100) : 100

  let repeatPairs = 0
  let improvedPairs = 0
  individuals.forEach(user => {
    ['PHQ9', 'GAD7', 'PSS10', 'WHO5'].forEach(instrument => {
      const series = filteredAssessments
        .filter(a => a.user_id === user.id && a.instrument === instrument)
        .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
      if (series.length >= 2) {
        repeatPairs += 1
        const improved = instrument === 'WHO5'
          ? series[series.length - 1].total_score > series[0].total_score
          : series[series.length - 1].total_score < series[0].total_score
        if (improved) improvedPairs += 1
      }
    })
  })
  const improvedFollowUps = filteredFollowUps.filter(f => f.outcome_status === 'improved').length
  const totalOutcomeEvaluated = repeatPairs + filteredFollowUps.filter(f => f.outcome_status).length
  const improvementRate = totalOutcomeEvaluated > 0
    ? Math.round(((improvedPairs + improvedFollowUps) / totalOutcomeEvaluated) * 100)
    : 0

  const crisisReferrals = filteredReferrals.filter(r => r.crisis_flagged || r.priority === 'urgent' || r.status === 'escalated')
  const crisisCompleted = crisisReferrals.filter(r => Boolean(r.crisis_completed_at)).length
  const crisisCompletionRate = crisisReferrals.length > 0 ? Math.round((crisisCompleted / crisisReferrals.length) * 100) : 100

  const serviceUtilisation = TIERS.map(tier => {
    const count = nonCancelledReferrals.filter(r => {
      const svc = services.find(s => s.id === r.service_id)
      return svc?.tier === tier.id
    }).length
    return { tier: tier.label, count }
  })

  const equity = {
    age_group: buildEquityGroupStats('age_group', individuals, filteredReferrals, positiveScreenUserIds),
    gender: buildEquityGroupStats('gender', individuals, filteredReferrals, positiveScreenUserIds),
    nationality_group: buildEquityGroupStats('nationality_group', individuals, filteredReferrals, positiveScreenUserIds),
    language: buildEquityGroupStats('language', individuals, filteredReferrals, positiveScreenUserIds),
    geography: buildEquityGroupStats('geography', individuals, filteredReferrals, positiveScreenUserIds),
  }

  const alerts = []
  Object.entries(equity).forEach(([dimension, rows]) => {
    rows.forEach(row => {
      if (!row.suppressed && row.positiveScreens > 0 && row.conversionRate < 70) {
        alerts.push(`Lower hand-off conversion (${row.conversionRate}%) observed in ${dimension.replace('_', ' ')}: ${row.group}.`)
      }
      if (!row.suppressed && row.avgWaitHours !== null && row.avgWaitHours > 48) {
        alerts.push(`Extended average wait (${row.avgWaitHours}h) observed in ${dimension.replace('_', ' ')}: ${row.group}.`)
      }
    })
  })

  return {
    optedInCount: individuals.length,
    totalAssessments: filteredAssessments.length,
    positiveScreenCount: positiveScreenUserIds.size,
    convertedCount,
    conversionRate,
    referralCompletionRate,
    attendanceRate,
    avgWaitHours,
    medianWaitHours,
    slaComplianceRate,
    improvementRate,
    crisisTotal: crisisReferrals.length,
    crisisCompleted,
    crisisCompletionRate,
    serviceUtilisation,
    adverseEvents: (adverseEvents || []).map(({ id, referral_id, category, severity, summary, action_taken, status, created_at }) => ({
      id,
      referral_id,
      category,
      severity,
      summary,
      action_taken,
      status,
      created_at,
    })),
    equity,
    alerts,
  }
}

export async function getOutcomeAndSafetyMetrics(dateRangeDays = 30) {
  if (!supabase) {
    const db = loadDemoDb()
    return computeOutcomeDataset({
      users: db.users,
      consents: db.consents || [],
      assessments: db.assessments,
      referrals: db.referrals,
      followUps: db.follow_ups,
      services: db.support_services,
      adverseEvents: db.adverse_events || [],
      dateRangeDays,
    })
  }

  const { data, error } = await supabase.rpc('get_outcome_and_safety_metrics', {
    date_range_days: dateRangeDays,
  })
  if (error) throw error
  return data
}

export async function updateAdverseEventStatus(id, status) {
  if (!['open', 'reviewed', 'resolved'].includes(status)) throw new Error('Invalid status.')
  if (!supabase) {
    const db = loadDemoDb()
    const item = (db.adverse_events || []).find(ev => ev.id === id)
    if (!item) throw new Error('Adverse event not found.')
    item.status = status
    appendDemoAudit(db, 'admin', 'UPDATE_ADVERSE_EVENT', 'adverse_events', id)
    saveDemoDb(db)
    return item
  }
  const { data, error } = await supabase.from('adverse_events').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}
