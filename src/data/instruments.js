export const assessmentStem = 'Over the last 2 weeks, how often have you been bothered by any of the following problems?'
export const assessmentStemAr = 'خلال الأسبوعين الماضيين، كم مرة عانيت من أي من المشكلات التالية؟'

export const assessmentOptions = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
export const assessmentOptionsAr = ['أبداً', 'عدة أيام', 'أكثر من نصف الأيام', 'تقريباً كل يوم']

export const pssStem = 'In the last month, how often have you felt or thought the following?'
export const pssStemAr = 'خلال الشهر الماضي، كم مرة شعرت أو فكرت بما يلي؟'
export const pssOptions = ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often']
export const pssOptionsAr = ['أبداً', 'نادراً جداً', 'أحياناً', 'كثيراً إلى حد ما', 'كثيراً جداً']

export const whoStem = 'Over the last two weeks, how often have you felt the following?'
export const whoStemAr = 'خلال الأسبوعين الماضيين، كم مرة شعرت بما يلي؟'
export const whoOptions = [
  'At no time',
  'Some of the time',
  'Less than half of the time',
  'More than half of the time',
  'Most of the time',
  'All of the time',
]
export const whoOptionsAr = ['في أي وقت (أبداً)', 'في بعض الأوقات', 'أقل من نصف الوقت', 'أكثر من نصف الوقت', 'معظم الوقت', 'طوال الوقت']

export const functioningQuestion = {
  prompt: 'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
  promptAr: 'إذا أشرت إلى أي من المشكلات السابقة، ما مدى صعوبة قيامك بعملك أو العناية بشؤون المنزل أو الانسجام مع الآخرين؟',
  justification: 'Optional validated functioning check (PHQ-9 Item 10). Helps distinguish temporary stress from symptoms affecting daily life.',
  justificationAr: 'فحص اختياري للأداء اليومي يساعد على التمييز بين الضغط العابر والأعراض المؤثرة في الحياة اليومية.',
  options: ['Not difficult at all', 'Somewhat difficult', 'Very difficult', 'Extremely difficult'],
  optionsAr: ['ليست صعبة على الإطلاق', 'صعبة نوعاً ما', 'صعبة جداً', 'صعبة للغاية'],
}

export const optInSignalsConfig = [
  {
    id: 'sleep_disruption',
    label: 'Noticeable change in sleep quality over the past 2 weeks',
    labelAr: 'تغيّر ملحوظ في جودة النوم خلال الأسبوعين الماضيين',
    justification: 'Sleep shifts are an early, non-diagnostic indicator that often precedes mood or anxiety escalation.',
    justificationAr: 'تغيرات النوم مؤشر مبكر غير تشخيصي يسبق أحياناً تفاقم القلق أو المزاج.',
  },
  {
    id: 'work_study_strain',
    label: 'Sustained stress at work, university, or caregiving responsibilities',
    labelAr: 'ضغط مستمر في العمل أو الدراسة أو مسؤوليات الرعاية',
    justification: 'Helps match you to practical coping, community, or flexible tele-mental health options.',
    justificationAr: 'يساعد على ترشيح خيارات دعم عملي أو مجتمعي أو عن بُعد تناسب جدولك.',
  },
  {
    id: 'physical_symptom_overlap',
    label: 'Physical symptoms alongside distress (e.g., fatigue, headaches, chest tightness, blood-sugar/blood-pressure swings)',
    labelAr: 'أعراض جسدية مصاحبة (مثل الإرهاق، الصداع، ضيق الصدر، أو تقلبات السكر/الضغط)',
    justification: 'Supports coordinated primary-care and mental health follow-up if you choose to share this context.',
    justificationAr: 'يدعم التنسيق بين الرعاية الأولية والصحة النفسية إذا اخترت مشاركة هذا السياق.',
  },
]

export const instrumentNotice =
  'PHQ-9 & GAD-7 developed by Drs. Spitzer, Williams, Kroenke et al. PSS-10 (Cohen et al.) & WHO-5 (WHO Regional Office for Europe) are standard public screening instruments. Arabic text shown in this prototype requires formal clinical/institutional sign-off before production clinical use.'
export const instrumentNoticeAr =
  'تُستخدم مقاييس PHQ-9 وGAD-7 وPSS-10 وWHO-5 كأدوات فحص معيارية معتمدة. النسخة العربية في هذا النموذج الأولي تخضع للمراجعة السريرية المؤسسية قبل الاستخدام الإكلينيكي الإنتاجي.'

export const instruments = {
  PHQ9: {
    name: 'PHQ-9',
    nameAr: 'مقياس الاكتئاب PHQ-9',
    focus: 'mood & depression screening',
    focusAr: 'فحص المزاج وأعراض الاكتئاب',
    max: 27,
    optionMin: 0,
    optionMax: 3,
    stem: assessmentStem,
    stemAr: assessmentStemAr,
    options: assessmentOptions,
    optionsAr: assessmentOptionsAr,
    source: 'https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/PHQ-9_English.pdf',
    items: [
      'Little interest or pleasure in doing things',
      'Feeling down, depressed, or hopeless',
      'Trouble falling or staying asleep, or sleeping too much',
      'Feeling tired or having little energy',
      'Poor appetite or overeating',
      'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
      'Trouble concentrating on things, such as reading the newspaper or watching television',
      'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
      'Thoughts that you would be better off dead or of hurting yourself in some way',
    ],
    itemsAr: [
      'قلة الاهتمام أو الاستمتاع بممارسة الأشياء',
      'الشعور بالحزن أو الاكتئاب أو اليأس',
      'صعوبة النوم أو البقاء نائماً أو النوم أكثر من المعتاد',
      'الشعور بالتعب أو قلة الطاقة',
      'ضعف الشهية أو الإفراط في الأكل',
      'الشعور بالسوء تجاه نفسك أو أنك خذلت نفسك أو عائلتك',
      'صعوبة التركيز في أشياء مثل القراءة أو مشاهدة التلفاز',
      'بطء الحركة أو الكلام لدرجة يلاحظها الآخرون، أو العكس: التململ وكثرة الحركة بشكل غير معتاد',
      'أفكار بأن الموت أفضل لك أو إيذاء نفسك بطريقة ما',
    ],
    bands: [
      { max: 4, severity: 'minimal' },
      { max: 9, severity: 'mild' },
      { max: 14, severity: 'moderate' },
      { max: 19, severity: 'moderately severe' },
      { max: 27, severity: 'severe' },
    ],
  },
  GAD7: {
    name: 'GAD-7',
    nameAr: 'مقياس القلق GAD-7',
    focus: 'anxiety screening',
    focusAr: 'فحص القلق',
    max: 21,
    optionMin: 0,
    optionMax: 3,
    stem: assessmentStem,
    stemAr: assessmentStemAr,
    options: assessmentOptions,
    optionsAr: assessmentOptionsAr,
    source: 'https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/GAD-7_English.pdf',
    items: [
      'Feeling nervous, anxious or on edge',
      'Not being able to stop or control worrying',
      'Worrying too much about different things',
      'Trouble relaxing',
      'Being so restless that it is hard to sit still',
      'Becoming easily annoyed or irritable',
      'Feeling afraid as if something awful might happen',
    ],
    itemsAr: [
      'الشعور بالتوتر أو القلق أو الانزعاج الشديد',
      'عدم القدرة على إيقاف القلق أو التحكم فيه',
      'القلق المفرط بشأن أشياء مختلفة',
      'صعوبة الاسترخاء',
      'التململ الشديد لدرجة صعوبة الجلوس بهدوء',
      'سرعة الانزعاج أو الانفعال',
      'الشعور بالخوف وكأن شيئاً سيئاً قد يحدث',
    ],
    bands: [
      { max: 4, severity: 'minimal' },
      { max: 9, severity: 'mild' },
      { max: 14, severity: 'moderate' },
      { max: 21, severity: 'severe' },
    ],
  },
  PSS10: {
    name: 'PSS-10',
    nameAr: 'مقياس الضغط المدرك PSS-10',
    focus: 'perceived stress',
    focusAr: 'الضغط النفسي المُدرك',
    max: 40,
    optionMin: 0,
    optionMax: 4,
    reverseIndices: [3, 4, 6, 7],
    stem: pssStem,
    stemAr: pssStemAr,
    options: pssOptions,
    optionsAr: pssOptionsAr,
    source: 'https://www.das.nh.gov/wellness/docs/percieved%20stress%20scale.pdf',
    items: [
      'Been upset because of something that happened unexpectedly?',
      'Felt that you were unable to control the important things in your life?',
      'Felt nervous and stressed?',
      'Felt confident about your ability to handle your personal problems?',
      'Felt that things were going your way?',
      'Found that you could not cope with all the things that you had to do?',
      'Been able to control irritations in your life?',
      'Felt that you were on top of things?',
      'Been angered because of things that were outside of your control?',
      'Felt difficulties were piling up so high that you could not overcome them?',
    ],
    itemsAr: [
      'انزعجت بسبب حدوث شيء غير متوقع؟',
      'شعرت أنك غير قادر على التحكم في الأمور المهمة في حياتك؟',
      'شعرت بالتوتر والضغط النفسي؟',
      'شعرت بالثقة في قدرتك على التعامل مع مشكلاتك الشخصية؟',
      'شعرت أن الأمور تسير بالطريقة التي تريدها؟',
      'وجدت أنك لا تستطيع التكيف مع كل ما يجب عليك القيام به؟',
      'تمكنت من السيطرة على مصادر الإزعاج في حياتك؟',
      'شعرت أنك مسيطر على مجريات الأمور؟',
      'غضبت بسبب أمور خارجة عن سيطرتك؟',
      'شعرت أن الصعوبات تتراكم لدرجة لا يمكنك تجاوزها؟',
    ],
    bands: [
      { max: 13, severity: 'minimal' },
      { max: 26, severity: 'moderate' },
      { max: 40, severity: 'severe' },
    ],
  },
  WHO5: {
    name: 'WHO-5',
    nameAr: 'مؤشر الرفاه العام WHO-5',
    focus: 'general wellbeing (0–100 index)',
    focusAr: 'الرفاه العام (مؤشر من 0 إلى 100)',
    max: 100,
    optionMin: 0,
    optionMax: 5,
    positiveScale: true,
    multiplier: 4,
    stem: whoStem,
    stemAr: whoStemAr,
    options: whoOptions,
    optionsAr: whoOptionsAr,
    source: 'https://www.psykiatri-regionh.dk/who-5/Pages/default.aspx',
    items: [
      'I have felt cheerful and in good spirits',
      'I have felt calm and relaxed',
      'I have felt active and vigorous',
      'I woke up feeling fresh and rested',
      'My daily life has been filled with things that interest me',
    ],
    itemsAr: [
      'شعرت بالبهجة والروح المعنوية الجيدة',
      'شعرت بالهدوء والاسترخاء',
      'شعرت بالنشاط والحيوية',
      'استيقظت وأنا أشعر بالانتعاش والراحة',
      'كانت حياتي اليومية مليئة بأشياء تثير اهتمامي',
    ],
    bands: [
      { max: 28, severity: 'severe' },
      { max: 50, severity: 'moderate' },
      { max: 71, severity: 'mild' },
      { max: 100, severity: 'minimal' },
    ],
  },
}

export const severityMeanings = {
  minimal: {
    means: 'Your responses suggest low distress / steady wellbeing over the screening period. Even positive or mild results serve as a helpful baseline.',
    meansAr: 'تشير إجاباتك إلى مستوى منخفض من الأعراض أو رفاه جيد خلال فترة الفحص، وتُعد نقطة مرجعية مفيدة للمتابعة.',
    doesNotMean: 'It does not guarantee nothing is bothering you, and it does not bar you from seeking support whenever you wish.',
    doesNotMeanAr: 'لا يعني ذلك غياب أي تحديات، ولا يمنعك من طلب الدعم في أي وقت.',
  },
  mild: {
    means: 'Your responses suggest mild symptoms or slightly lowered wellbeing. Early self-care, peer connection, or a low-intensity check-in can prevent symptoms from building up.',
    meansAr: 'تشير إجاباتك إلى أعراض خفيفة أو انخفاض بسيط في الرفاه. التدخل المبكر والدعم المجتمعي يساعدان على منع تفاقم الأعراض.',
    doesNotMean: 'It is not a diagnosis of depression or an anxiety disorder, nor does it mean you must enter specialist care.',
    doesNotMeanAr: 'ليس تشخيصاً طبياً للاكتئاب أو القلق، ولا يفرض عليك دخول رعاية تخصصية.',
  },
  moderate: {
    means: 'Your responses suggest moderate symptoms or stress that may affect daily routines, work, or sleep. A structured conversation with primary care, tele-mental health, or counselling is recommended.',
    meansAr: 'تشير إجاباتك إلى أعراض أو ضغوط متوسطة قد تؤثر على النوم والعمل. يُنصح بالتواصل مع الرعاية الأولية أو الصحة النفسية عن بُعد.',
    doesNotMean: 'It is not a clinical diagnosis on its own. A licensed professional evaluates full context, medical factors, and your preferences.',
    doesNotMeanAr: 'لا يُعد تشخيصاً سريرياً بحد ذاته؛ فالمختص المرخص يقيّم الصورة الصحية والشخصية كاملة.',
  },
  'moderately severe': {
    means: 'Your responses suggest moderately severe symptoms that commonly interfere with day-to-day functioning. Timely review with a licensed clinician is encouraged.',
    meansAr: 'تشير إجاباتك إلى أعراض متوسطة إلى شديدة غالباً ما تؤثر على الأداء اليومي. يُنصح بمراجعة مختص مرخص في وقت قريب.',
    doesNotMean: 'It is not a permanent label or automated clinical decision. Licensed clinicians determine appropriate care together with you.',
    doesNotMeanAr: 'ليست تصنيفاً دائماً أو قراراً آلياً؛ بل خطوة لتنسيق الرعاية المناسبة مع طبيب أو مختص مرخص.',
  },
  severe: {
    means: 'Your responses suggest substantial distress or very low wellbeing. Prompt human support from a licensed clinician or specialist team is strongly recommended.',
    meansAr: 'تشير إجاباتك إلى مستوى مرتفع من الضيق أو انخفاض ملحوظ في الرفاه. يُوصى بشدة بالتواصل السريع مع مختص مرخص.',
    doesNotMean: 'It does not replace an in-person or tele-health clinical evaluation, and it is never shared with employers.',
    doesNotMeanAr: 'لا يغني عن التقييم السريري المباشر، ولا يُكشف لأي جهة عمل مطلقاً.',
  },
}

export function scoreAssessment(instrumentId, answers) {
  const instrument = Object.hasOwn(instruments, instrumentId) && instruments[instrumentId]
  if (!instrument) throw new Error('Please choose a supported assessment.')
  if (
    !Array.isArray(answers) ||
    answers.length !== instrument.items.length ||
    !Array.from(answers).every(
      value => Number.isInteger(value) && value >= instrument.optionMin && value <= instrument.optionMax
    )
  ) {
    throw new Error('Please answer every question before submitting.')
  }

  const reverseSet = new Set(instrument.reverseIndices || [])
  const rawTotal = answers.reduce((sum, value, idx) => {
    const itemScore = reverseSet.has(idx) ? instrument.optionMax - value : value
    return sum + itemScore
  }, 0)

  const total = instrument.multiplier ? rawTotal * instrument.multiplier : rawTotal
  const band = instrument.bands.find(item => total <= item.max) || instrument.bands[instrument.bands.length - 1]
  return { total, rawTotal, severity: band.severity }
}

export function explainCalculation(instrumentId, answers) {
  const instrument = instruments[instrumentId]
  if (!instrument || !Array.isArray(answers)) return ''
  const { total, rawTotal } = scoreAssessment(instrumentId, answers)
  if (instrumentId === 'PSS10') {
    return `Deterministic sum of 10 items (0–4 each; positive items 4, 5, 7, and 8 reverse-scored as 4 − response) = ${total} / 40. No ML prediction is involved in this score.`
  }
  if (instrumentId === 'WHO5') {
    return `Deterministic sum of 5 positive wellbeing items (0–5 each = ${rawTotal} / 25) multiplied by 4 = ${total} / 100. Higher scores represent better wellbeing; ≤50 warrants follow-up review.`
  }
  return `Deterministic sum of ${instrument.items.length} validated items (0–3 each) = ${total} / ${instrument.max}. Calculated transparently using clinical thresholds, separate from any ML experiment.`
}

export function hasSelfHarmResponse(instrumentId, answers) {
  return instrumentId === 'PHQ9' && Array.isArray(answers) && answers[8] > 0
}

export function compareAssessments(current, previous) {
  if (!current || !previous) return null
  const instrument = instruments[current.instrument]
  const isPositiveScale = Boolean(instrument?.positiveScale)
  const delta = current.total_score - previous.total_score
  const improved = isPositiveScale ? delta > 0 : delta < 0
  const worsened = isPositiveScale ? delta < 0 : delta > 0
  const direction = improved ? 'improved' : worsened ? 'worsened' : 'unchanged'
  const absDelta = Math.abs(delta)
  const significant = isPositiveScale ? absDelta >= 10 : absDelta >= 5
  const sign = delta > 0 ? `+${delta}` : `${delta}`
  let summary = `Unchanged (${current.total_score}) compared to your check-in on ${new Date(previous.created_at).toLocaleDateString()}.`
  if (delta !== 0) {
    summary = `${improved ? 'Improved' : 'Shifted'} (${sign} points) since ${new Date(previous.created_at).toLocaleDateString()} (${previous.severity} → ${current.severity})${significant ? ' — notable change over time' : ''}.`
  }
  return { delta, direction, significant, summary }
}
