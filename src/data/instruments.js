export const assessmentStem = 'Over the last 2 weeks, how often have you been bothered by any of the following problems?'
export const assessmentOptions = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
export const instrumentNotice = 'Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc. No permission required to reproduce, translate, display or distribute.'

export const instruments = {
  PHQ9: {
    name: 'PHQ-9', focus: 'mood', max: 27,
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
    bands: [{ max: 4, severity: 'minimal' }, { max: 9, severity: 'mild' }, { max: 14, severity: 'moderate' }, { max: 19, severity: 'moderately severe' }, { max: 27, severity: 'severe' }],
  },
  GAD7: {
    name: 'GAD-7', focus: 'anxiety', max: 21,
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
    bands: [{ max: 4, severity: 'minimal' }, { max: 9, severity: 'mild' }, { max: 14, severity: 'moderate' }, { max: 21, severity: 'severe' }],
  },
}

export function scoreAssessment(instrumentId, answers) {
  const instrument = Object.hasOwn(instruments, instrumentId) && instruments[instrumentId]
  if (!instrument) throw new Error('Please choose a supported assessment.')
  if (!Array.isArray(answers) || answers.length !== instrument.items.length || !Array.from(answers).every(value => Number.isInteger(value) && value >= 0 && value <= 3)) {
    throw new Error('Please answer every question using one of the four options.')
  }
  const total = answers.reduce((sum, value) => sum + value, 0)
  return { total, severity: instrument.bands.find(band => total <= band.max).severity }
}

export function hasSelfHarmResponse(instrumentId, answers) {
  return instrumentId === 'PHQ9' && Array.isArray(answers) && answers[8] > 0
}
