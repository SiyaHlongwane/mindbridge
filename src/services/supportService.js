import { supabase } from '../lib/supabase'
import { hasSelfHarmResponse } from '../data/instruments'
import { loadDemoDb } from '../lib/demoStore'

export const TIERS = [
  { id: 'self_help', label: 'Self-help & wellbeing education', labelAr: 'المساعدة الذاتية والتوعية', description: 'Private, evidence-informed resources you can explore at your own pace.' },
  { id: 'community', label: 'Community support', labelAr: 'الدعم المجتمعي', description: 'Stigma-free peer connection and encouragement through community groups.' },
  { id: 'primary_care', label: 'Primary healthcare', labelAr: 'الرعاية الصحية الأولية', description: 'Coordinated review with a family physician considering both physical and mental wellbeing.' },
  { id: 'tele_mental_health', label: 'Tele-mental health', labelAr: 'الصحة النفسية عن بُعد', description: 'Confidential bilingual video or phone sessions with licensed counsellors.' },
  { id: 'specialist', label: 'Specialist mental healthcare', labelAr: 'الرعاية النفسية التخصصية', description: 'Outpatient psychotherapy, psychiatric care, and complex comorbidity support.' },
  { id: 'urgent_emergency', label: 'Urgent & emergency assistance', labelAr: 'المساعدة العاجلة والطوارئ', description: 'Immediate human crisis support via Sakina (800-725462) and UAE Ambulance (998).' },
]

export async function listServices() {
  if (!supabase) {
    const db = loadDemoDb()
    return db.support_services
      .filter(service => service.active)
      .sort((a, b) => TIERS.findIndex(tier => tier.id === a.tier) - TIERS.findIndex(tier => tier.id === b.tier) || a.name.localeCompare(b.name))
  }
  const { data, error } = await supabase.from('support_services').select('*').eq('active', true).order('tier').order('name')
  if (error) throw error
  return [...data].sort((a, b) => TIERS.findIndex(tier => tier.id === a.tier) - TIERS.findIndex(tier => tier.id === b.tier) || a.name.localeCompare(b.name))
}

export function recommendTiers(latestAssessments = []) {
  const ranks = { minimal: 0, mild: 1, moderate: 2, 'moderately severe': 3, severe: 4 }
  const latest = ['PHQ9', 'GAD7', 'PSS10', 'WHO5']
    .map(instrument => latestAssessments
      .filter(row => row.instrument === instrument)
      .sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0))[0])
    .filter(Boolean)
  const worst = Math.max(0, ...latest.map(row => ranks[row.severity] ?? 0))
  const urgent = latest.some(row => hasSelfHarmResponse(row.instrument, row.answers))
  const hasPhysicalOverlap = latest.some(row => Array.isArray(row.opt_in_signals) && row.opt_in_signals.includes('physical_symptom_overlap'))

  let tiers
  if (urgent) {
    tiers = ['urgent_emergency', 'specialist', 'tele_mental_health', 'primary_care']
  } else if (worst >= 3) {
    tiers = ['specialist', 'tele_mental_health', 'primary_care']
  } else if (worst === 2) {
    tiers = hasPhysicalOverlap
      ? ['primary_care', 'tele_mental_health', 'community']
      : ['tele_mental_health', 'primary_care', 'community']
  } else {
    tiers = hasPhysicalOverlap
      ? ['self_help', 'community', 'primary_care']
      : ['self_help', 'community', 'tele_mental_health']
  }

  return { tiers, urgent, worst }
}
