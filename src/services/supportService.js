import { supabase } from '../lib/supabase'
import { hasSelfHarmResponse } from '../data/instruments'

export const TIERS = [
  { id: 'self_help', label: 'Self-help', description: 'Resources and small steps you can explore at your own pace.' },
  { id: 'community', label: 'Community support', description: 'Connection and encouragement through community-based support.' },
  { id: 'primary_care', label: 'Primary care', description: 'A first conversation with a healthcare professional about your wellbeing.' },
  { id: 'mental_health_professional', label: 'Mental health professionals', description: 'Support from a qualified professional focused on mental wellbeing.' },
  { id: 'specialist', label: 'Specialist services', description: 'More focused support for complex or ongoing needs.' },
]

export async function listServices() {
  if (!supabase) throw new Error('Supabase not configured.')
  const { data, error } = await supabase.from('support_services').select('*').eq('active', true).order('tier').order('name')
  if (error) throw error
  return [...data].sort((a, b) => TIERS.findIndex(tier => tier.id === a.tier) - TIERS.findIndex(tier => tier.id === b.tier) || a.name.localeCompare(b.name))
}

export function recommendTiers(latestAssessments = []) {
  const ranks = { minimal: 0, mild: 1, moderate: 2, 'moderately severe': 3, severe: 4 }
  const latest = ['PHQ9', 'GAD7'].map(instrument => latestAssessments
    .filter(row => row.instrument === instrument)
    .sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0))[0]).filter(Boolean)
  const worst = Math.max(0, ...latest.map(row => ranks[row.severity] ?? 0))
  return {
    tiers: worst >= 3 ? ['mental_health_professional', 'specialist', 'primary_care'] : worst === 2 ? ['primary_care', 'community'] : ['self_help', 'community'],
    urgent: latest.some(row => hasSelfHarmResponse(row.instrument, row.answers)),
  }
}
