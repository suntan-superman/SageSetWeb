import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { runtimeEnvironment } from '../config/runtimeEnvironment.js';
import { blogPosts, getBlogPost } from '../data/blogPosts.js';
import { faqEntries } from '../data/faqEntries.js';

const ORIGIN = 'https://sagesetfitness.com';


const pages = {
  '/': ['SageSet Fitness | Personalized Workout Plans & Progress Tracking', 'Build a fitness routine that fits your goals, schedule, and equipment. Plan workouts, track progress, log nutrition, and use optional AI-assisted recommendations.'],
  '/features': ['SageSet Features | Workouts, Nutrition & Progress', 'Explore SageSet workout planning, set-by-set logging, nutrition estimates, weigh-ins, streaks, and progress tracking in one fitness app.'],
  '/fitness-ai-coach': ['AI-Assisted Fitness Planning | SageSet', 'Create workout plans from your goals, workout history, and schedule. SageSet keeps recommendations reviewable and under your control.'],
  '/workout-plans': ['Personalized Workout Plans | SageSet', 'Build strength, cardio, or hybrid workout plans around your goals, experience, available equipment, and schedule.'],
  '/weight-loss': ['Fitness and Weight-Tracking Tools | SageSet', 'Support a consistent fitness routine with workout tracking, weigh-ins, food logging, and progress trends in SageSet.'],
  '/muscle-building': ['Strength Training Plans & Workout Logs | SageSet', 'Plan strength workouts, log sets and reps, and review previous performance to help guide your next session.'],
  '/nutrition': ['Nutrition and Meal Tracking | SageSet', 'Log meals, review estimated calories and macros, and keep daily nutrition alongside your SageSet workout routine.'],
  '/fitness-challenges': ['Fitness Challenges & Habit Tracking | SageSet', 'Build consistency with workout streaks, weekly progress reviews, and habit-focused fitness tracking.'],
  '/pricing': ['SageSet Pricing | Free Trial and Premium Plan', 'Review SageSet plan details and the current Premium trial before starting. See the terms and billing details on the pricing page.'],
  '/download': ['Download the SageSet Fitness App', 'Find SageSet for iPhone and Android and start building a workout routine that fits your goals and schedule.'],
  '/ar-squats': ['AR Squat Tracking | SageSet', 'Explore SageSet augmented-reality squat tracking and workout tools. Review app compatibility and setup details before use.'],
  '/testimonials': ['SageSet User Stories', 'Read user experiences with SageSet workout planning and fitness tracking.'],
  '/faq': ['SageSet Fitness App FAQ', 'Answers about SageSet workout planning, nutrition tracking, supported devices, accounts, and subscriptions.'],
  '/supported-devices': ['SageSet Supported Devices', 'Check device compatibility and setup information for SageSet fitness features.'],
  '/before-after': ['SageSet Progress Stories', 'See how SageSet helps people organize workout routines and follow their progress over time.'],
  '/upcoming': ['SageSet Product Updates', 'See current SageSet product updates and features as they become available.'],
  '/privacy': ['SageSet Privacy Policy', 'Learn how SageSet handles account, workout, and fitness information.'],
  '/terms': ['SageSet Terms of Service', 'Read the terms that apply when using SageSet.'],
  '/support': ['SageSet Support', 'Get help with SageSet account access, workout tracking, billing, and app questions.'],
  '/contact': ['Contact SageSet Support', 'Contact the SageSet team for help with the fitness app, your account, or billing.'],
  '/blog': ['SageSet Blog | Workout and Nutrition Guidance', 'Practical articles on workout planning, nutrition logging, and building a routine that fits your schedule and equipment.'],
};
blogPosts.forEach((post) => { pages[`/blog/${post.slug}`] = [`${post.title} | SageSet Blog`, post.description]; });

const organizationNode = { '@type': 'Organization', '@id': `${ORIGIN}/#organization`, name: 'SageSet Fitness', url: ORIGIN };

const mobileApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: 'SageSet Fitness',
  operatingSystem: 'iOS, Android',
  applicationCategory: 'HealthApplication',
  offers: { '@type': 'Offer', price: '9.99', priceCurrency: 'USD', description: '14-day free trial, then $9.99/month' },
  publisher: { '@id': `${ORIGIN}/#organization` },
};

const schemaByPath = {
  '/': () => [organizationNode, { '@context': 'https://schema.org', '@type': 'WebSite', name: 'SageSet Fitness', url: ORIGIN, description: 'A fitness app for workout planning, nutrition logging, and progress tracking.' }],
  '/download': () => [mobileApplicationSchema],
  '/pricing': () => [mobileApplicationSchema],
  '/faq': () => [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqEntries.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }],
  '/blog': () => [{ '@context': 'https://schema.org', '@type': 'Blog', name: 'SageSet Blog', url: `${ORIGIN}/blog`, publisher: { '@id': `${ORIGIN}/#organization` } }],
};

function blogPostSchema(pathname) {
  const slug = pathname.startsWith('/blog/') ? pathname.slice('/blog/'.length) : null;
  const post = slug && getBlogPost(slug);
  if (!post) return null;
  return [{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { '@type': 'Organization', name: 'SageSet Fitness' },
    publisher: { '@id': `${ORIGIN}/#organization` },
    mainEntityOfPage: `${ORIGIN}/blog/${post.slug}`,
  }];
}

const privatePath = (path) => /^(\/(admin|dashboard|login|signup|auth|verify-email|verify-sms|complete-profile|concept|billing|account)(\/|$))/.test(path)
  || path.startsWith('/share/verified-squats/')
  || ['/before-after', '/testimonials'].includes(path);

function setMeta(attribute, key, content, value = 'name') {
  let node = document.head.querySelector(`meta[${value}="${key}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(value, key);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

export default function SeoMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const [title, description] = pages[pathname] || ['SageSet Fitness', 'Plan workouts, track fitness progress, and build a routine that fits your life with SageSet.'];
    const canonical = `${ORIGIN}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', runtimeEnvironment.isStaging || privatePath(pathname) ? 'noindex, nofollow' : 'index, follow');
    setMeta('property', 'og:title', title, 'property');
    setMeta('property', 'og:description', description, 'property');
    setMeta('property', 'og:url', canonical, 'property');
    setMeta('name', 'twitter:card', 'summary_large_image');
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;

    const schemaList = (schemaByPath[pathname] ? schemaByPath[pathname]() : null) || blogPostSchema(pathname);
    let schemaNode = document.head.querySelector('script[data-sageset-schema]');
    if (schemaList) {
      if (!schemaNode) {
        schemaNode = document.createElement('script');
        schemaNode.type = 'application/ld+json';
        schemaNode.dataset.sagesetSchema = 'true';
        document.head.appendChild(schemaNode);
      }
      schemaNode.textContent = JSON.stringify(schemaList);
    } else if (schemaNode) {
      schemaNode.remove();
    }
  }, [pathname]);
  return null;
}
