import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Compass,
  HeartHandshake,
  Lock,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Video,
} from 'lucide-react'
import { useI18n } from '../context/i18n'
import { crisisDetails } from '../data/safety'
import heroCareImg from '../assets/images/hero_abudhabi_care_1795026010458.jpg'
import clinicianCareImg from '../assets/images/clinician_review_care_1795025979483.jpg'
import telehealthHomeImg from '../assets/images/telehealth_home_session_1795025988056.jpg'

const PILLARS_EN = [
  ['01', Compass, 'Recognise early', 'Validated PHQ-9, GAD-7, PSS-10 & WHO-5 check-ins in Arabic & English help track changes over time.', 'Early detection · Bilingual'],
  ['02', Activity, 'Understand clearly', 'Transparent score explanations show what a result means and does not mean — never presented as a diagnosis.', 'Score transparency · Not diagnostic'],
  ['03', HeartHandshake, 'Navigate stepped care', 'Discover Abu Dhabi options across self-help, community, primary care, tele-mental health, specialist, and urgent care.', 'Six care tiers · Guided matching'],
  ['04', Stethoscope, 'Connect & coordinate', 'Book referrals and tele-health slots, and optionally share physical-care context (Malaffi-ready demo concept).', 'Referral workflow · Physical sync'],
  ['05', ShieldAlert, 'Human-led escalation', 'Immediate emergency guidance (998 & Sakina 800-725462) and priority clinician review bypass routine queues.', 'Human-in-the-loop · Priority triage'],
  ['06', Lock, 'Measure outcomes fairly', 'De-identified monitoring of conversion, wait times, attendance, symptom improvement, and demographic fairness.', 'Population equity · n ≥ 3 guard'],
]

const PILLARS_AR = [
  ['01', Compass, 'التعرّف المبكر', 'أدوات فحص معتمدة (PHQ-9 وGAD-7 وPSS-10 وWHO-5) بالعربية والإنجليزية لمتابعة التغيرات عبر الزمن.', 'كشف مبكر · ثنائي اللغة'],
  ['02', Activity, 'الفهم الواضح', 'شرح شفاف لمعنى النتيجة وما لا تعنيه — ولا تُقدّم أبداً كتشخيص طبي.', 'شفافية النتائج · ليس تشخيصاً'],
  ['03', HeartHandshake, 'التوجيه المتدرج', 'اكتشف خدمات أبوظبي عبر المساعدة الذاتية، الدعم المجتمعي، الرعاية الأولية، الطب النفسي عن بُعد، والرعاية التخصصية.', 'ستة مستويات للرعاية'],
  ['04', Stethoscope, 'التواصل والتنسيق', 'إرسال إحالات وحجز مواعيد ومشاركة السياق الصحي الجسدي بموافقتك (مفهوم جاهز للتكامل مع ملفي).', 'تنسيق الإحالات والرعاية'],
  ['05', ShieldAlert, 'تصعيد بقيادة المختصين', 'إرشاد طوارئ فوري (998 وخط سكينة 800-725462) وتحويل عاجل للمختصين يتجاوز قوائم الانتظار الاعتيادية.', 'إشراف بشري · أولوية عاجلة'],
  ['06', Lock, 'قياس النتائج والعدالة', 'متابعة غير مُعرّفة الهوية لمعدلات التحويل، أوقات الانتظار، الحضور، تحسن الأعراض، والعدالة عبر الفئات.', 'العدالة السكانية · حماية الخصوصية'],
]

const FAQS = [
  {
    qEn: 'Does MindBridge AI diagnose mental health conditions or replace doctors?',
    aEn: 'No. MindBridge AI provides validated screening and navigation only. Licensed healthcare professionals make all clinical assessments and care decisions.',
    qAr: 'هل تقوم منصة مايند بريدج AI بتشخيص الحالات النفسية أو استبدال الأطباء؟',
    aAr: 'لا. توفر المنصة فحصاً أولياً وتوجيهاً للرعاية فقط، بينما يتخذ المختصون المرخصون جميع القرارات السريرية.',
  },
  {
    qEn: 'Can my employer or insurer see my wellbeing scores?',
    aEn: 'Never. Identifiable screening answers, scores, and personal notes are protected by granular consent and strict role-based controls, and are never shared with employers.',
    qAr: 'هل يمكن لجهة عملي أو شركة التأمين الاطلاع على نتائجي؟',
    aAr: 'مطلقاً. جميع الإجابات والنتائج والملاحظات محمية بموافقة تفصيلية وضوابط وصول صارمة ولا تُكشف أبداً لجهات العمل.',
  },
  {
    qEn: 'Are the TAMM, Malaffi, and provider listings live integrations right now?',
    aEn: 'For this prototype, provider directories and Malaffi clinical summaries use clearly labelled demonstration records. Real UAE emergency numbers (UAE 998, Sakina 800-725462, Estijaba 800 1717) are provided for safety guidance.',
    qAr: 'هل التكامل مع ملفي وتم ومزودي الخدمة فعلياً في هذا النموذج؟',
    aAr: 'تعتمد سجلات ملفي وبعض المزودين في هذا النموذج على بيانات محاكاة واضحة التسمية، مع توفير أرقام الطوارئ الحقيقية في الإمارات (998 وسكينة 800-725462).',
  },
]

export default function Landing() {
  const { lang, t } = useI18n()
  const isAr = lang === 'ar'
  const pillars = isAr ? PILLARS_AR : PILLARS_EN
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight
  const [imgErrors, setImgErrors] = useState({})

  function markImgError(key) {
    setImgErrors(prev => (prev[key] ? prev : { ...prev, [key]: true }))
  }

  return (
    <div className="landing-stack">
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-content">
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <h1 id="hero-heading">{t.hero.title}</h1>
          <p className="hero-copy">{t.hero.subtitle}</p>

          <div className="actions hero-actions">
            <Link className="button button-lg" to="/register">
              <span>{t.hero.ctaPrimary}</span>
              <ArrowIcon size={18} aria-hidden="true" />
            </Link>
            <Link className="text-cta" to="/login">
              <span>{t.hero.ctaDemo}</span>
              <ArrowIcon size={16} aria-hidden="true" />
            </Link>
          </div>

          <p className="hero-meta-line">{t.hero.disclaimer}</p>
        </div>

        <figure className="hero-media">
          {!imgErrors.hero ? (
            <img
              src={heroCareImg}
              alt={
                isAr
                  ? 'مركز رعاية صحية هادئ ومضاء بنور الشمس في أبوظبي للاستشارة والتوجيه المبكر'
                  : 'Sunlit Abu Dhabi wellbeing care pavilion interior designed for calm reflection and early support'
              }
              className="hero-photo"
              referrerPolicy="no-referrer"
              onError={() => markImgError('hero')}
            />
          ) : (
            <div className="media-fallback" role="img" aria-label={t.brand}>
              <HeartHandshake size={42} strokeWidth={1.6} aria-hidden="true" />
            </div>
          )}
          <div className="hero-media-scrim" aria-hidden="true" />
          <figcaption className="hero-media-caption">
            <span className="hero-caption-title">{t.tagline}</span>
            <span className="hero-caption-sub">
              {isAr
                ? 'فحوصات PHQ-9 وGAD-7 وPSS-10 وWHO-5 · رعاية متدرجة في أبوظبي'
                : 'PHQ-9 · GAD-7 · PSS-10 · WHO-5 · Stepped Abu Dhabi navigation'}
            </span>
          </figcaption>
        </figure>
      </section>

      <section className="pathway-band" aria-label={t.hero.journeyLabel}>
        <ol className="pathway-list">
          {t.hero.journeySteps.map((step, i) => (
            <li key={step} className="pathway-step">
              <span className="pathway-num">0{i + 1}</span>
              <span className="pathway-label">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section" aria-labelledby="how-it-works">
        <div className="section-head">
          <p className="eyebrow">{t.landing.howEyebrow}</p>
          <h2 id="how-it-works">{t.landing.howTitle}</h2>
        </div>

        <div className="spotlight-grid">
          <article className="spotlight-card">
            <div className="spotlight-media">
              {!imgErrors.clinician ? (
                <img
                  src={clinicianCareImg}
                  alt={
                    isAr
                      ? 'طبيب ومراجع يناقشان نتائج المتابعة الصحية بهدوء'
                      : 'Clinician and patient reviewing wellbeing progress notes together in a primary care consultation'
                  }
                  referrerPolicy="no-referrer"
                  onError={() => markImgError('clinician')}
                />
              ) : (
                <div className="media-fallback">
                  <Stethoscope size={36} strokeWidth={1.6} aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="spotlight-body">
              <p className="spotlight-kicker">
                {isAr ? 'مساحة المختصين والرعاية الأولية' : 'Clinician-led triage & primary care sync'}
              </p>
              <h3>
                {isAr
                  ? 'قرارات سريرية بإشراف بشري مع تنسيق الصحة الجسدية'
                  : 'Human clinicians review referrals, safety flags, and shared physical context'}
              </h3>
              <p>
                {isAr
                  ? 'تصل الإحالات العاجلة مباشرة إلى مسار الأولوية، مع إمكانية مشاركة السياق الطبي الاختياري بموافقة المراجع.'
                  : 'Priority referrals bypass routine queues while opt-in comorbidities and lab context bridge primary and mental health teams.'}
              </p>
              <Link className="text-cta" to="/login">
                <span>{isAr ? 'استكشاف مساحات المختصين' : 'Open clinical workspaces'}</span>
                <ArrowIcon size={15} aria-hidden="true" />
              </Link>
            </div>
          </article>

          <article className="spotlight-card">
            <div className="spotlight-media">
              {!imgErrors.telehealth ? (
                <img
                  src={telehealthHomeImg}
                  alt={
                    isAr
                      ? 'مراجع يتلقى جلسة دعم نفسي عن بُعد من منزله باللغتين العربية والإنجليزية'
                      : 'Adult participating in a confidential bilingual tele-mental health session from home'
                  }
                  referrerPolicy="no-referrer"
                  onError={() => markImgError('telehealth')}
                />
              ) : (
                <div className="media-fallback">
                  <Video size={36} strokeWidth={1.6} aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="spotlight-body">
              <p className="spotlight-kicker">
                {isAr ? 'رعاية متدرجة ثنائية اللغة' : 'Confidential stepped support in Arabic & English'}
              </p>
              <h3>
                {isAr
                  ? 'من المساعدة الذاتية إلى الاستشارة عن بُعد والرعاية التخصصية'
                  : 'Clear matching across six Abu Dhabi support tiers'}
              </h3>
              <p>
                {isAr
                  ? 'تصفّح الخدمات حسب مستوى الدعم أو اللغة أو الموقع في أبوظبي والعين والظفرة، واحجز موعدك بوضوح.'
                  : 'Filter trusted services by support tier, language, and emirate region, then track every referral milestone.'}
              </p>
              <Link className="text-cta" to="/register">
                <span>{isAr ? 'ابدأ فحصك الطوعي' : 'Start voluntary check-in'}</span>
                <ArrowIcon size={15} aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>

        <div className="card-grid capabilities-grid">
          {pillars.map(([num, Icon, title, copy, meta]) => (
            <article className="card capability-card" key={title}>
              <div className="capability-top">
                <span className="capability-num">{num}</span>
                <Icon className="card-icon" size={22} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <p className="capability-meta">{meta}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-split-info" aria-label="Governance and urgent assistance">
        <article className="card governance-card" aria-labelledby="privacy-safety-heading">
          <div className="section-label-row">
            <ShieldCheck size={20} className="teal-icon" aria-hidden="true" />
            <h2 id="privacy-safety-heading">{t.landing.privacyTitle}</h2>
          </div>
          <p>{t.landing.privacyBody}</p>
          <div className="governance-actions">
            <Link className="text-cta" to="/privacy">
              <span>{t.hero.ctaPrivacy}</span>
              <ArrowIcon size={15} aria-hidden="true" />
            </Link>
          </div>
        </article>

        <article className="safety-panel" aria-labelledby="emergency-heading">
          <div className="section-label-row">
            <PhoneCall size={20} className="teal-icon" aria-hidden="true" />
            <h2 id="emergency-heading">{t.landing.emergencyTitle}</h2>
          </div>
          <ul className="crisis-list">
            {crisisDetails.emergencyNumbers.map(item => (
              <li key={item.label}>
                <strong>
                  {isAr ? item.labelAr : item.label}: <span className="mono-num">{item.number}</span>
                </strong>{' '}
                — {isAr ? item.noteAr : item.note}
              </li>
            ))}
          </ul>
          <p className="muted">{isAr ? crisisDetails.disclaimerAr : crisisDetails.disclaimer}</p>
        </article>
      </section>

      <section className="card landing-faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading">{t.landing.faqTitle}</h2>
        <div className="faq-list">
          {FAQS.map(item => (
            <details key={item.qEn} className="faq-item">
              <summary>{isAr ? item.qAr : item.qEn}</summary>
              <p>{isAr ? item.aAr : item.aEn}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
