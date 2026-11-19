const STORAGE_KEY = 'mindbridge_demo_v3'
const SESSION_KEY = 'mindbridge_demo_session_v3'

function hoursAgo(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
}

function daysAgo(d) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString()
}

function daysFromNow(d) {
  return new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString()
}

function makeId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

function createInitialData() {
  return {
    users: [
      {
        id: '00000000-0000-4000-9000-000000000001',
        email: 'amira@mindbridge.demo',
        password: 'password123',
        full_name: 'Amira Al-Mansoori',
        role: 'individual',
        created_at: daysAgo(30),
        equity: {
          age_group: '25-34',
          gender: 'Female',
          nationality_group: 'UAE National',
          language: 'Arabic',
          geography: 'Abu Dhabi City',
        },
        physical_context: {
          conditions: ['Sleep disruption', 'Thyroid / metabolic care'],
          primary_care_note: 'Follows up quarterly with primary care for fatigue and sleep regulation.',
          medications_note: 'Levothyroxine 50mcg (routine primary care)',
          malaffi_simulated: {
            source: 'Simulated Malaffi-Compatible Summary (Demo Only — No Live EHR Connection)',
            last_bp: '118/76 mmHg',
            hba1c: '5.5%',
            tsh: '2.4 mIU/L',
            vitamin_d: '28 ng/mL',
            primary_clinic: 'SEHA Family Medicine — Al Bateen (Simulated)',
          },
          updated_at: daysAgo(5),
        },
      },
      {
        id: '00000000-0000-4000-9000-000000000002',
        email: 'dr.tariq@mindbridge.demo',
        password: 'password123',
        full_name: 'Dr. Tariq Al-Hashemi (Licensed Clinician)',
        role: 'professional',
        created_at: daysAgo(90),
        equity: { age_group: '35-49', gender: 'Male', nationality_group: 'UAE National', language: 'Arabic', geography: 'Abu Dhabi City' },
        physical_context: null,
      },
      {
        id: '00000000-0000-4000-9000-000000000008',
        email: 'dr.nadia@mindbridge.demo',
        password: 'password123',
        full_name: 'Dr. Nadia Khan (Primary Care Physician)',
        role: 'primary_care',
        created_at: daysAgo(85),
        equity: { age_group: '35-49', gender: 'Female', nationality_group: 'Expatriate resident', language: 'English', geography: 'Abu Dhabi City' },
        physical_context: null,
      },
      {
        id: '00000000-0000-4000-9000-000000000009',
        email: 'coordinator@mindbridge.demo',
        password: 'password123',
        full_name: 'Layla Al-Dhaheri (Care Coordinator)',
        role: 'coordinator',
        created_at: daysAgo(100),
        equity: {},
        physical_context: null,
      },
      {
        id: '00000000-0000-4000-9000-000000000003',
        email: 'admin@mindbridge.demo',
        password: 'password123',
        full_name: 'Omar Al-Mazrouei (System Administrator)',
        role: 'admin',
        created_at: daysAgo(120),
        equity: {},
        physical_context: null,
      },
      {
        id: '00000000-0000-4000-9000-000000000010',
        email: 'analyst@mindbridge.demo',
        password: 'password123',
        full_name: 'Population Health Analyst',
        role: 'analyst',
        created_at: daysAgo(110),
        equity: {},
        physical_context: null,
      },
      {
        id: '00000000-0000-4000-9000-000000000004',
        email: 'rashid.demo@example.invalid',
        password: 'password123',
        full_name: 'Rashid K.',
        role: 'individual',
        created_at: daysAgo(22),
        equity: { age_group: '18-24', gender: 'Male', nationality_group: 'UAE National', language: 'Arabic', geography: 'Al Ain' },
        physical_context: {
          conditions: ['Asthma / respiratory'],
          primary_care_note: 'University student experiencing exam stress and asthma flare-ups.',
          medications_note: 'Salbutamol PRN',
          malaffi_simulated: {
            source: 'Simulated Malaffi-Compatible Summary (Demo Only — No Live EHR Connection)',
            last_bp: '114/72 mmHg',
            hba1c: '5.1%',
            tsh: '1.9 mIU/L',
            vitamin_d: '22 ng/mL',
            primary_clinic: 'Al Ain Primary Health Centre (Simulated)',
          },
          updated_at: daysAgo(14),
        },
      },
      {
        id: '00000000-0000-4000-9000-000000000005',
        email: 'priya.demo@example.invalid',
        password: 'password123',
        full_name: 'Priya S.',
        role: 'individual',
        created_at: daysAgo(18),
        equity: { age_group: '25-34', gender: 'Female', nationality_group: 'Expatriate resident', language: 'English', geography: 'Al Dhafra' },
        physical_context: {
          conditions: ['Diabetes / blood-sugar management', 'Chronic pain / fatigue'],
          primary_care_note: 'Coordinating work-stress anxiety with diabetes management.',
          medications_note: 'Metformin 500mg',
          malaffi_simulated: {
            source: 'Simulated Malaffi-Compatible Summary (Demo Only — No Live EHR Connection)',
            last_bp: '126/82 mmHg',
            hba1c: '7.1%',
            tsh: '2.1 mIU/L',
            vitamin_d: '19 ng/mL',
            primary_clinic: 'Al Dhafra Community Clinic (Simulated)',
          },
          updated_at: daysAgo(8),
        },
      },
      {
        id: '00000000-0000-4000-9000-000000000006',
        email: 'marco.demo@example.invalid',
        password: 'password123',
        full_name: 'Marco D.',
        role: 'individual',
        created_at: daysAgo(15),
        equity: { age_group: '35-49', gender: 'Male', nationality_group: 'Expatriate resident', language: 'English', geography: 'Abu Dhabi City' },
        physical_context: {
          conditions: ['Hypertension / cardiovascular'],
          primary_care_note: 'Blood pressure monitoring alongside shift-work stress.',
          medications_note: 'Amlodipine 5mg',
          updated_at: daysAgo(6),
        },
      },
      {
        id: '00000000-0000-4000-9000-000000000007',
        email: 'claire.demo@example.invalid',
        password: 'password123',
        full_name: 'Claire W.',
        role: 'individual',
        created_at: daysAgo(12),
        equity: { age_group: '35-49', gender: 'Female', nationality_group: 'Expatriate resident', language: 'English', geography: 'Al Ain' },
        physical_context: null,
      },
    ],
    consents: [
      { user_id: '00000000-0000-4000-9000-000000000001', consent_type: 'terms', granted: true, updated_at: daysAgo(30) },
      { user_id: '00000000-0000-4000-9000-000000000001', consent_type: 'retain_history', granted: true, updated_at: daysAgo(30) },
      { user_id: '00000000-0000-4000-9000-000000000001', consent_type: 'share_results', granted: true, updated_at: daysAgo(30) },
      { user_id: '00000000-0000-4000-9000-000000000001', consent_type: 'share_contact', granted: true, updated_at: daysAgo(30) },
      { user_id: '00000000-0000-4000-9000-000000000001', consent_type: 'share_physical_context', granted: true, updated_at: daysAgo(5) },
      { user_id: '00000000-0000-4000-9000-000000000001', consent_type: 'research_opt_in', granted: true, updated_at: daysAgo(30) },
      ...['00000000-0000-4000-9000-000000000004', '00000000-0000-4000-9000-000000000005', '00000000-0000-4000-9000-000000000006', '00000000-0000-4000-9000-000000000007'].flatMap(uid => [
        { user_id: uid, consent_type: 'terms', granted: true, updated_at: daysAgo(20) },
        { user_id: uid, consent_type: 'retain_history', granted: true, updated_at: daysAgo(20) },
        { user_id: uid, consent_type: 'research_opt_in', granted: true, updated_at: daysAgo(20) },
      ]),
      ...['00000000-0000-4000-9000-000000000002', '00000000-0000-4000-9000-000000000003', '00000000-0000-4000-9000-000000000008', '00000000-0000-4000-9000-000000000009', '00000000-0000-4000-9000-000000000010'].map(uid => ({
        user_id: uid, consent_type: 'terms', granted: true, updated_at: daysAgo(60),
      })),
    ],
    assessments: [
      {
        id: '00000000-0000-4000-7000-000000000001',
        user_id: '00000000-0000-4000-9000-000000000001',
        instrument: 'PHQ9',
        total_score: 14,
        severity: 'moderate',
        answers: [2, 2, 2, 2, 1, 2, 2, 1, 0],
        functioning: 2,
        opt_in_signals: ['sleep_disruption', 'work_study_strain', 'physical_symptom_overlap'],
        created_at: daysAgo(21),
      },
      {
        id: '00000000-0000-4000-7000-000000000002',
        user_id: '00000000-0000-4000-9000-000000000001',
        instrument: 'GAD7',
        total_score: 12,
        severity: 'moderate',
        answers: [2, 2, 2, 2, 1, 2, 1],
        functioning: 2,
        opt_in_signals: ['work_study_strain'],
        created_at: daysAgo(14),
      },
      {
        id: '00000000-0000-4000-7000-000000000009',
        user_id: '00000000-0000-4000-9000-000000000001',
        instrument: 'WHO5',
        total_score: 48,
        severity: 'moderate',
        answers: [2, 2, 3, 2, 3],
        functioning: 1,
        opt_in_signals: ['sleep_disruption'],
        created_at: daysAgo(9),
      },
      {
        id: '00000000-0000-4000-7000-000000000003',
        user_id: '00000000-0000-4000-9000-000000000001',
        instrument: 'PHQ9',
        total_score: 8,
        severity: 'mild',
        answers: [1, 1, 2, 1, 1, 1, 1, 0, 0],
        functioning: 1,
        opt_in_signals: ['sleep_disruption'],
        created_at: daysAgo(2),
      },
      {
        id: '00000000-0000-4000-7000-000000000004',
        user_id: '00000000-0000-4000-9000-000000000004',
        instrument: 'GAD7',
        total_score: 16,
        severity: 'severe',
        answers: [3, 3, 2, 2, 2, 2, 2],
        functioning: 2,
        opt_in_signals: ['work_study_strain'],
        created_at: daysAgo(10),
      },
      {
        id: '00000000-0000-4000-7000-000000000005',
        user_id: '00000000-0000-4000-9000-000000000004',
        instrument: 'GAD7',
        total_score: 9,
        severity: 'mild',
        answers: [2, 1, 2, 1, 1, 1, 1],
        functioning: 1,
        opt_in_signals: [],
        created_at: daysAgo(1),
      },
      {
        id: '00000000-0000-4000-7000-000000000006',
        user_id: '00000000-0000-4000-9000-000000000005',
        instrument: 'PHQ9',
        total_score: 18,
        severity: 'moderately severe',
        answers: [2, 2, 3, 3, 2, 2, 2, 1, 1],
        functioning: 3,
        opt_in_signals: ['sleep_disruption', 'physical_symptom_overlap'],
        created_at: daysAgo(5),
      },
      {
        id: '00000000-0000-4000-7000-000000000007',
        user_id: '00000000-0000-4000-9000-000000000006',
        instrument: 'PSS10',
        total_score: 24,
        severity: 'moderate',
        answers: [3, 3, 3, 2, 2, 2, 2, 2, 3, 2],
        functioning: 2,
        opt_in_signals: ['work_study_strain', 'physical_symptom_overlap'],
        created_at: daysAgo(4),
      },
      {
        id: '00000000-0000-4000-7000-000000000008',
        user_id: '00000000-0000-4000-9000-000000000007',
        instrument: 'PHQ9',
        total_score: 11,
        severity: 'moderate',
        answers: [2, 2, 2, 1, 1, 1, 1, 1, 0],
        functioning: 1,
        opt_in_signals: [],
        created_at: daysAgo(7),
      },
    ],
    support_services: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Guided Sleep, Stress & CBT Self-Help Library',
        tier: 'self_help',
        description: 'Bilingual guided exercises for sleep hygiene, paced breathing, and stress management at your own pace.',
        location: 'Online / Mobile Web (Abu Dhabi & UAE)',
        contact: 'Self-guided digital toolkit (no referral required)',
        website: 'https://www.doh.gov.ae',
        eligibility: 'Open to all Abu Dhabi residents aged 16+ · Free',
        languages: 'Arabic, English',
        operating_hours: '24/7 self-paced access',
        appointment_method: 'Immediate self-start (no appointment needed)',
        delivery_mode: 'Self-guided digital',
        typical_wait: 'Immediate',
        availability: 'Available',
        geography: 'Abu Dhabi City, Al Ain, Al Dhafra',
        last_verified_at: '2026-10-15',
        verified: false,
        active: true,
        created_at: daysAgo(60),
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Abu Dhabi Community & Youth Wellbeing Circle (Demo)',
        tier: 'community',
        description: 'Stigma-free moderated peer groups and resilience workshops for students and working-age adults.',
        location: 'Al Bateen Community Hub & Online',
        contact: 'Community Desk (Demo Listing)',
        website: '',
        eligibility: 'Ages 18–45 in Abu Dhabi · Voluntary participation',
        languages: 'Arabic, English',
        operating_hours: 'Mon–Sat 09:00–20:00',
        appointment_method: 'MindBridge referral or walk-in registration',
        delivery_mode: 'In-person & virtual group',
        typical_wait: '1–3 days',
        availability: 'Open slots this week',
        geography: 'Abu Dhabi City, Al Ain',
        last_verified_at: '2026-10-10',
        verified: false,
        active: true,
        created_at: daysAgo(55),
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        name: 'Abu Dhabi Integrated Family Medicine Desk (Demo)',
        tier: 'primary_care',
        description: 'Primary healthcare physicians coordinating physical health (thyroid, diabetes, BP, sleep) with early mental wellbeing care.',
        location: 'Abu Dhabi City, Al Ain & Al Dhafra Primary Centres',
        contact: 'Estijaba Navigation: 800 1717 (confirm clinic eligibility)',
        website: 'https://www.seha.ae',
        eligibility: 'UAE residents with Thiqa / Daman / valid health insurance',
        languages: 'Arabic, English',
        operating_hours: 'Sun–Thu 08:00–20:00',
        appointment_method: 'MindBridge referral or TAMM / clinic booking',
        delivery_mode: 'In-person primary clinic',
        typical_wait: '2–5 days',
        availability: 'Available',
        geography: 'Abu Dhabi City, Al Ain, Al Dhafra',
        last_verified_at: '2026-10-18',
        verified: false,
        active: true,
        created_at: daysAgo(50),
      },
      {
        id: '00000000-0000-4000-8000-000000000004',
        name: 'Abu Dhabi Bilingual Tele-Mental Health Clinic (Demo)',
        tier: 'tele_mental_health',
        description: 'Confidential video or telephone sessions with licensed psychologists and counsellors, reducing stigma and travel barriers.',
        location: 'Virtual Tele-Health across Abu Dhabi Emirate',
        contact: 'Tele-intake Desk (Demo Listing)',
        website: '',
        eligibility: 'Mild to moderately severe symptoms · Evening & weekend slots',
        languages: 'Arabic, English',
        operating_hours: 'Sun–Sat 08:00–22:00',
        appointment_method: 'Online referral & video link',
        delivery_mode: 'Video / Phone tele-health',
        typical_wait: '24–48 hours',
        availability: 'High capacity',
        geography: 'Abu Dhabi City, Al Ain, Al Dhafra',
        last_verified_at: '2026-10-20',
        verified: false,
        active: true,
        created_at: daysAgo(45),
      },
      {
        id: '00000000-0000-4000-8000-000000000005',
        name: 'Specialist Mental Health & Psychiatry Outpatient Service (Demo)',
        tier: 'specialist',
        description: 'Multidisciplinary psychiatric evaluation, structured CBT/ACT therapy, and complex physical-mental comorbidity management.',
        location: 'Abu Dhabi City & Al Ain Specialist Centres',
        contact: 'Sakina Guidance: 800-725462 (800-SAKINA) · Specialist Desk',
        website: '',
        eligibility: 'Moderate-to-severe, complex, or clinician-referred cases',
        languages: 'Arabic, English',
        operating_hours: 'Sun–Thu 08:00–18:00',
        appointment_method: 'Clinician review & scheduled outpatient slot',
        delivery_mode: 'In-person & hybrid',
        typical_wait: '3–7 days',
        availability: 'Limited — coordinator triaged',
        geography: 'Abu Dhabi City, Al Ain',
        last_verified_at: '2026-10-12',
        verified: false,
        active: true,
        created_at: daysAgo(40),
      },
      {
        id: '00000000-0000-4000-8000-000000000006',
        name: 'Sakina & UAE Urgent Emergency Assistance',
        tier: 'urgent_emergency',
        description: 'Immediate crisis support line (800-SAKINA / 800-725462) and 24/7 UAE medical ambulance (998) for urgent risk.',
        location: 'Abu Dhabi & All UAE',
        contact: 'Sakina: 800-725462 · Ambulance: 998 · Police: 999 · Estijaba: 800 1717',
        website: 'https://www.doh.gov.ae',
        eligibility: 'Immediate access for anyone in urgent distress — no referral required',
        languages: 'Arabic, English',
        operating_hours: '24/7 Emergency / Helpline hours',
        appointment_method: 'Direct phone call or hospital emergency department',
        delivery_mode: '24/7 Crisis phone & emergency care',
        typical_wait: 'Immediate',
        availability: '24/7 Active',
        geography: 'Abu Dhabi City, Al Ain, Al Dhafra',
        last_verified_at: '2026-11-01',
        verified: true,
        active: true,
        created_at: daysAgo(35),
      },
    ],
    referrals: [
      {
        id: '00000000-0000-4000-6000-000000000001',
        user_id: '00000000-0000-4000-9000-000000000001',
        service_id: '00000000-0000-4000-8000-000000000004',
        professional_id: '00000000-0000-4000-9000-000000000002',
        status: 'appointment_scheduled',
        priority: 'routine',
        crisis_flagged: false,
        crisis_acknowledged_at: null,
        crisis_completed_at: null,
        first_response_at: daysAgo(12),
        appointment_at: daysFromNow(2),
        appointment_mode: 'Video tele-health',
        attendance_status: 'scheduled',
        share_results: true,
        share_contact: true,
        share_physical_context: true,
        user_note: 'Prefer Arabic-speaking tele-mental health session; please coordinate sleep and thyroid context with primary care.',
        feedback: null,
        created_at: daysAgo(13),
        updated_at: daysAgo(5),
      },
      {
        id: '00000000-0000-4000-6000-000000000002',
        user_id: '00000000-0000-4000-9000-000000000004',
        service_id: '00000000-0000-4000-8000-000000000004',
        professional_id: '00000000-0000-4000-9000-000000000002',
        status: 'follow_up_completed',
        priority: 'routine',
        crisis_flagged: false,
        crisis_acknowledged_at: null,
        crisis_completed_at: null,
        first_response_at: daysAgo(9),
        appointment_at: daysAgo(3),
        appointment_mode: 'Video tele-health',
        attendance_status: 'attended',
        share_results: true,
        share_contact: true,
        share_physical_context: true,
        user_note: 'Arabic-speaking counsellor preferred.',
        feedback: { rating: 5, comment: 'Quick video appointment and supportive follow-up.', created_at: daysAgo(1) },
        created_at: daysAgo(10),
        updated_at: daysAgo(1),
      },
      {
        id: '00000000-0000-4000-6000-000000000003',
        user_id: '00000000-0000-4000-9000-000000000005',
        service_id: '00000000-0000-4000-8000-000000000005',
        professional_id: '00000000-0000-4000-9000-000000000002',
        status: 'escalated',
        priority: 'urgent',
        crisis_flagged: true,
        crisis_acknowledged_at: hoursAgo(118),
        crisis_completed_at: daysAgo(4),
        first_response_at: hoursAgo(118),
        appointment_at: daysAgo(3),
        appointment_mode: 'Urgent clinician phone call',
        attendance_status: 'attended',
        share_results: true,
        share_contact: true,
        share_physical_context: true,
        user_note: 'Urgent human check-in requested after PHQ-9 Item 9 endorsed.',
        feedback: null,
        created_at: daysAgo(5),
        updated_at: daysAgo(4),
      },
      {
        id: '00000000-0000-4000-6000-000000000004',
        user_id: '00000000-0000-4000-9000-000000000006',
        service_id: '00000000-0000-4000-8000-000000000003',
        professional_id: '00000000-0000-4000-9000-000000000002',
        status: 'professional_review',
        priority: 'routine',
        crisis_flagged: false,
        crisis_acknowledged_at: null,
        crisis_completed_at: null,
        first_response_at: daysAgo(3),
        appointment_at: null,
        appointment_mode: 'In-person primary clinic',
        attendance_status: 'pending',
        share_results: true,
        share_contact: false,
        share_physical_context: true,
        user_note: 'Looking for integrated primary care + stress check.',
        feedback: null,
        created_at: daysAgo(4),
        updated_at: daysAgo(3),
      },
      {
        id: '00000000-0000-4000-6000-000000000005',
        user_id: '00000000-0000-4000-9000-000000000007',
        service_id: '00000000-0000-4000-8000-000000000005',
        professional_id: '00000000-0000-4000-9000-000000000002',
        status: 'submitted',
        priority: 'routine',
        crisis_flagged: false,
        crisis_acknowledged_at: null,
        crisis_completed_at: null,
        first_response_at: null,
        appointment_at: null,
        appointment_mode: 'In-person outpatient',
        attendance_status: 'pending',
        share_results: true,
        share_contact: true,
        share_physical_context: false,
        user_note: 'Evening slot requested.',
        feedback: null,
        created_at: daysAgo(3),
        updated_at: daysAgo(3),
      },
    ],
    follow_ups: [
      {
        id: '00000000-0000-4000-5000-000000000001',
        referral_id: '00000000-0000-4000-6000-000000000001',
        author_id: '00000000-0000-4000-9000-000000000002',
        note: 'Tele-mental health video appointment scheduled. Coordinated with Primary Care regarding TSH/sleep review.',
        outcome: 'Appointment scheduled; coordinated primary care check',
        outcome_status: 'coordinated_care',
        created_at: daysAgo(5),
      },
      {
        id: '00000000-0000-4000-5000-000000000002',
        referral_id: '00000000-0000-4000-6000-000000000002',
        author_id: '00000000-0000-4000-9000-000000000002',
        note: 'Attended CBT coping session; patient reports improved sleep and exam focus.',
        outcome: 'Symptom & functioning improved (GAD-7 16 → 9)',
        outcome_status: 'improved',
        created_at: daysAgo(1),
      },
      {
        id: '00000000-0000-4000-5000-000000000003',
        referral_id: '00000000-0000-4000-6000-000000000003',
        author_id: '00000000-0000-4000-9000-000000000002',
        note: 'Human clinician completed same-day crisis safety outreach, shared Sakina 800-725462 safety plan, and arranged specialist review.',
        outcome: 'Crisis handover acknowledged & safety protocol completed',
        outcome_status: 'stepped_up',
        created_at: daysAgo(4),
      },
    ],
    adverse_events: [
      {
        id: '00000000-0000-4000-4000-000000000001',
        referral_id: '00000000-0000-4000-6000-000000000003',
        reported_by: '00000000-0000-4000-9000-000000000002',
        category: 'Delayed remote outreach in Al Dhafra',
        severity: 'moderate',
        summary: 'Remote specialist hand-off in Al Dhafra required manual triage pairing, adding 2 hours to initial callback.',
        action_taken: 'Routed to tele-triage clinician; human safety call completed within 2 hours.',
        status: 'resolved',
        created_at: daysAgo(4),
      },
    ],
    audit_logs: [
      { id: 1, actor_id: '00000000-0000-4000-9000-000000000002', action: 'CRISIS_RESPONSE_COMPLETED', table_name: 'referrals', record_id: '00000000-0000-4000-6000-000000000003', created_at: daysAgo(4) },
      { id: 2, actor_id: '00000000-0000-4000-9000-000000000002', action: 'FOLLOW_UP_COMPLETED', table_name: 'referrals', record_id: '00000000-0000-4000-6000-000000000002', created_at: daysAgo(1) },
      { id: 3, actor_id: '00000000-0000-4000-9000-000000000001', action: 'CONSENT_UPDATED', table_name: 'consents', record_id: '00000000-0000-4000-9000-000000000001', created_at: daysAgo(5) },
    ],
  }
}

let memoryDb = null
let memorySessionUserId = null

export function loadDemoDb() {
  if (memoryDb) return memoryDb
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.support_services)) {
        if (Array.isArray(parsed.consents)) {
          ['00000000-0000-4000-9000-000000000004', '00000000-0000-4000-9000-000000000005', '00000000-0000-4000-9000-000000000006', '00000000-0000-4000-9000-000000000007'].forEach(uid => {
            if (!parsed.consents.some(c => c.user_id === uid && c.consent_type === 'research_opt_in')) {
              parsed.consents.push({ user_id: uid, consent_type: 'research_opt_in', granted: true, updated_at: daysAgo(20) })
            }
          })
        }
        memoryDb = parsed
        return memoryDb
      }
    }
  } catch {
    // ignore storage errors
  }
  const initial = createInitialData()
  memoryDb = initial
  saveDemoDb(initial)
  return initial
}

export function saveDemoDb(db) {
  memoryDb = db
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // ignore
  }
}

export function getDemoSessionUserId() {
  if (memorySessionUserId) return memorySessionUserId
  try {
    const stored = window.localStorage.getItem(SESSION_KEY)
    if (stored) memorySessionUserId = stored
    return stored
  } catch {
    return memorySessionUserId
  }
}

export function setDemoSessionUserId(userId) {
  memorySessionUserId = userId || null
  try {
    if (userId) window.localStorage.setItem(SESSION_KEY, userId)
    else window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

export function buildDemoSession(user) {
  if (!user) return null
  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: { full_name: user.full_name, role: user.role },
    },
  }
}

export function appendDemoAudit(db, actorId, action, tableName, recordId) {
  const nextId = db.audit_logs.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
  db.audit_logs.unshift({
    id: nextId,
    actor_id: actorId || null,
    action,
    table_name: tableName,
    record_id: recordId,
    created_at: new Date().toISOString(),
  })
  if (db.audit_logs.length > 200) db.audit_logs.length = 200
}

export function demoSignUp(email, password, fullName) {
  const db = loadDemoDb()
  const normalized = email.trim().toLowerCase()
  if (db.users.some(u => u.email.toLowerCase() === normalized)) {
    return { data: { session: null, user: null, role: 'individual' }, error: { message: 'An account with this email already exists. Please log in or reset your password.' } }
  }
  const now = new Date().toISOString()
  const newUser = {
    id: makeId('user'),
    email: normalized,
    password,
    full_name: fullName.trim(),
    role: 'individual',
    created_at: now,
    equity: {},
    physical_context: null,
  }
  db.users.push(newUser)
  appendDemoAudit(db, newUser.id, 'INSERT', 'profiles', newUser.id)
  saveDemoDb(db)
  setDemoSessionUserId(newUser.id)
  const session = buildDemoSession(newUser)
  return { data: { session, user: session.user, role: newUser.role }, error: null }
}

export function demoSignIn(email, password) {
  const db = loadDemoDb()
  const normalized = email.trim().toLowerCase()
  const user = db.users.find(u => u.email.toLowerCase() === normalized && u.password === password)
  if (!user) {
    const emailExists = db.users.some(u => u.email.toLowerCase() === normalized)
    return {
      data: { session: null, user: null, role: 'individual' },
      error: {
        message: emailExists
          ? 'Incorrect password for that account. Check your password, click Forgot or reset password below, or use one of the one-click role sign-in buttons above.'
          : 'No account found with that email in this browser. Register a new account first, or use one of the one-click demo role buttons above (demo password: password123).',
      },
    }
  }
  setDemoSessionUserId(user.id)
  const session = buildDemoSession(user)
  return { data: { session, user: session.user, role: user.role }, error: null }
}

export function demoSignInAsRole(role) {
  const db = loadDemoDb()
  const user = db.users.find(u => u.role === role)
  if (!user) return { data: { session: null, role }, error: { message: `No ${role} demo account found.` } }
  setDemoSessionUserId(user.id)
  const session = buildDemoSession(user)
  return { data: { session, user: session.user, role: user.role }, error: null }
}

export function demoResetPassword(email, newPassword) {
  const db = loadDemoDb()
  const normalized = email.trim().toLowerCase()
  const user = db.users.find(u => u.email.toLowerCase() === normalized)
  if (!user) return { error: { message: 'No account found for that email address.' } }
  user.password = newPassword
  appendDemoAudit(db, user.id, 'PASSWORD_RESET', 'profiles', user.id)
  saveDemoDb(db)
  return { error: null }
}

export function demoSignOut() {
  setDemoSessionUserId(null)
  return { error: null }
}

export function demoGenerateId(prefix = 'id') {
  return makeId(prefix)
}
