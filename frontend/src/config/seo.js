/** Central SEO / GEO config — change SITE_URL when you use a custom domain */
export const SITE_URL = 'https://life-tracker-mern.vercel.app';
export const SITE_NAME = 'LifeTracker';

export const DEFAULT_DESCRIPTION =
  'LifeTracker is a free habit tracker for logging good and bad habits, daily scores, streaks, mood, and habit replacement. Built for consistent, focused days.';

export const DEFAULT_TITLE =
  'LifeTracker — Habit Tracker & Habit Replacement App';

/** FAQs: visible on landing (SEO) + JSON-LD FAQPage (GEO / rich results) */
export const LANDING_FAQS = [
  {
    question: 'What is LifeTracker?',
    answer:
      'LifeTracker is a web app for daily habit tracking. You log good habits you completed and bad habits you slipped on, get a daily net score and grade, and track streaks, mood, and trends over weeks and months.'
  },
  {
    question: 'What is habit replacement in LifeTracker?',
    answer:
      'Habit replacement links one bad habit to one good habit. Progress is measured over a multi-day window (for example the last 7 days), not a single checkbox, so success means consistently avoiding the bad habit and doing the good one.'
  },
  {
    question: 'Is LifeTracker free to use?',
    answer:
      'Yes. You can create an account, verify your email, log habits, view analytics, export your data, and use habit replacement without a paid plan.'
  },
  {
    question: 'How does the daily score work?',
    answer:
      'Good habits increase your score and bad habits reduce it. The app calculates a net score when you save the day and maps it to a grade from A to F so you can see progress at a glance.'
  },
  {
    question: 'Is LifeTracker designed for Islamic lifestyle habits?',
    answer:
      'Default habits include options such as Quran and reading, daily prayer, and missing Fajr, alongside general habits like exercise and sleep. You can also add custom good and bad habits.'
  },
  {
    question: 'How is LifeTracker different from other habit apps?',
    answer:
      'LifeTracker focuses on both good and bad habits in one daily log, honest multi-day habit replacement progress, streaks, mood, and private data export — without social leaderboards or complex gamification.'
  }
];

export function absoluteUrl(path = '/') {
  const base = SITE_URL.replace(/\/$/, '');
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildWebAppJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    description: DEFAULT_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    featureList: [
      'Daily good and bad habit logging',
      'Net score and letter grades',
      'Habit replacement with multi-day progress',
      'Streaks and mood tracking',
      'Weekly and monthly trends',
      'Data export (JSON/CSV)'
    ]
  };
}

export function buildFaqJsonLd(faqs = LANDING_FAQS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer
      }
    }))
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION
  };
}