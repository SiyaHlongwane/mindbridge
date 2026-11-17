import { supabase } from '../lib/supabase'
import { STATUS } from './referralService'
import { TIERS } from './supportService'

function client() {
  if (!supabase) throw new Error('Supabase not configured.')
  return supabase
}

async function countRows(table, column, value) {
  let query = client().from(table).select('*', { count: 'exact', head: true })
  if (column) query = query.eq(column, value)
  const { count, error } = await query
  if (error) throw error
  return count
}

export async function getAdminMetrics() {
  const roles = ['individual', 'professional', 'admin']
  const statuses = Object.keys(STATUS)
  const [users, assessments, referrals, followUps] = await Promise.all([
    Promise.all(roles.map(role => countRows('profiles', 'role', role))),
    countRows('assessments'),
    Promise.all(statuses.map(status => countRows('referrals', 'status', status))),
    countRows('follow_ups'),
  ])
  return { users: Object.fromEntries(roles.map((role, index) => [role, users[index]])), assessments, referrals: Object.fromEntries(statuses.map((status, index) => [status, referrals[index]])), followUps }
}

export async function listAdminServices() {
  const { data, error } = await client().from('support_services').select('*').order('name')
  if (error) throw error
  return data
}

export async function listAdminReferrals() {
  const { data, error } = await client().from('referrals')
    .select('id, user_id, status, created_at, service:support_services(name), user:profiles!referrals_user_id_fkey(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function acceptAdminReferral(id) {
  const { data, error } = await client().from('referrals')
    .update({ status: 'accepted' })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('This referral is no longer pending.')
}

export async function saveService(id, values) {
  const fields = { name: values.name.trim(), tier: values.tier, description: values.description.trim() || null, contact: values.contact.trim() || null, website: values.website.trim() || null }
  if (!fields.name) throw new Error('Enter a service name.')
  if (!TIERS.some(tier => tier.id === fields.tier)) throw new Error('Choose a support tier.')
  if (fields.website) {
    let url
    try { url = new URL(fields.website) } catch { throw new Error('Enter a full http or https website URL.') }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Enter a full http or https website URL.')
  }
  const query = id ? client().from('support_services').update(fields).eq('id', id) : client().from('support_services').insert(fields)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function setServiceFlag(id, flag, value) {
  if (!['active', 'verified'].includes(flag) || typeof value !== 'boolean') throw new Error('Invalid service setting.')
  const { data, error } = await client().from('support_services').update({ [flag]: value }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function listRecentAuditLogs() {
  const { data, error } = await client().from('audit_logs').select('id, action, table_name, record_id, actor_id, created_at').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(50)
  if (error) throw error
  return data
}
