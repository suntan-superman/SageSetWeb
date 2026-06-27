import { fileURLToPath } from "node:url";

export default {
  productName: "SageSet",
  productSlug: "sageset",
  reportProductKey: "SageSet",
  appRoot: fileURLToPath(new URL(".", import.meta.url)),
  baseUrl: "https://www.sagesetfitness.com",
  localUrl: "http://127.0.0.1:3000",
  environment: process.env.RELEASE_TEST_TARGET || "production",
  app: {
    type: "web",
    framework: "react-vite"
  },
  checks: {
    env: { enabled: true, blocking: true },
    browser: { enabled: true, blocking: true },
    routes: { enabled: true, blocking: true },
    auth: { enabled: true, blocking: false },
    stripe: { enabled: true, blocking: false },
    meta: { enabled: true, blocking: false },
    seo: { enabled: true, blocking: false },
    lighthouse: { enabled: false, blocking: false },
    links: { enabled: false, blocking: false }
  },
  requiredEnv: [],
  routes: ["/", "/pricing", "/features", "/login", "/signup", "/billing/success", "/billing/cancel"],
  expectedMetaPixelId: "2504506900022362",
  expectedMetaEvents: [
    {
      name: "PageView",
      classification: "required",
      blocking: true,
      description: "Every route/page load"
    },
    {
      name: "ViewContent",
      classification: "required",
      blocking: true,
      description: "Pricing, feature, and marketing pages"
    },
    {
      name: "StartTrial",
      classification: "required",
      blocking: true,
      description: "Trial begins on billing success confirmation"
    },
    {
      name: "Subscribe",
      classification: "required",
      blocking: true,
      description: "Paid subscription or subscription confirmation event"
    },
    {
      name: "CheckoutCancelled",
      classification: "recommended",
      blocking: false,
      description: "Stripe checkout cancelled or abandoned"
    },
    {
      name: "CompleteRegistration",
      classification: "safe-skipped",
      blocking: false,
      description: "User account created",
      reason: "Skipped in release certification because no safe production test user cleanup fixture is configured."
    },
    {
      name: "Purchase",
      classification: "safe-skipped",
      blocking: false,
      description: "Stripe confirmation if separate from Subscribe",
      reason: "Skipped because SageSet currently uses Subscribe as the safe confirmation event and release tests must not create real charges."
    }
  ],
  meta: {
    enabled: true,
    pixelIdEnv: "VITE_META_PIXEL_ID",
    expectedPixelId: process.env.VITE_META_PIXEL_ID || "2504506900022362",
    expectedEvents: [
      {
        name: "PageView",
        classification: "required",
        blocking: true,
        description: "Every route/page load"
      },
      {
        name: "ViewContent",
        classification: "required",
        blocking: true,
        description: "Pricing, feature, and marketing pages"
      },
      {
        name: "StartTrial",
        classification: "required",
        blocking: true,
        description: "Trial begins on billing success confirmation"
      },
      {
        name: "Subscribe",
        classification: "required",
        blocking: true,
        description: "Paid subscription or subscription confirmation event"
      },
      {
        name: "CheckoutCancelled",
        classification: "recommended",
        blocking: false,
        description: "Stripe checkout cancelled or abandoned"
      },
      {
        name: "CompleteRegistration",
        classification: "safe-skipped",
        blocking: false,
        description: "User account created",
        reason: "Skipped in release certification because no safe production test user cleanup fixture is configured."
      },
      {
        name: "Purchase",
        classification: "safe-skipped",
        blocking: false,
        description: "Stripe confirmation if separate from Subscribe",
        reason: "Skipped because SageSet currently uses Subscribe as the safe confirmation event and release tests must not create real charges."
      }
    ],
    requiredEvents: ["PageView", "ViewContent", "StartTrial", "Subscribe"],
    skippedEvents: [
      {
        eventName: "CompleteRegistration",
        reason: "No safe production test user cleanup fixture is configured."
      },
      {
        eventName: "Purchase",
        reason: "No separate safe Purchase event is currently emitted; Subscribe is the subscription confirmation event."
      }
    ],
    payloadRules: {
      Subscribe: {
        optionalFields: ["currency", "value", "content_type"],
        forbiddenFields: ["email", "phone", "name", "password"]
      }
    },
    routes: ["/", "/signup", "/pricing", "/billing/success", "/billing/cancel"]
  },
  auth: {
    enabled: true,
    testEmail: process.env.RELEASE_TEST_EMAIL,
    testPassword: process.env.RELEASE_TEST_PASSWORD,
    signupEnabled: false,
    cleanupTestUser: false,
    loginUrl: "/login",
    dashboardUrl: "/dashboard",
    credentials: {
      emailEnv: "RELEASE_TEST_EMAIL",
      passwordEnv: "RELEASE_TEST_PASSWORD"
    },
    selectors: {}
  },
  stripe: {
    enabled: true,
    testModeOnly: true,
    requireTestMode: true,
    safeCheckoutOnly: true,
    productionCheckoutAutomation: false,
    allowRealCharges: false,
    selectors: {}
  },
  seo: {
    enabled: true,
    requiredTitle: true,
    requiredDescription: true,
    requiredCanonical: false,
    requiredOpenGraph: true,
    requiredTwitterCards: false
  },
  reporting: {
    outputDir: "./reports/SageSet",
    formats: ["json", "html", "md", "certification"],
    archive: true
  }
};
