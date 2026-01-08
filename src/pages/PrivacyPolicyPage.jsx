import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <div className="max-w-content mx-auto px-6 py-16 lg:py-24">
        {/* Header */}
        <div className="max-w-3xl">
          <Link 
            to="/" 
            className="text-sage-600 hover:text-sage-700 text-sm font-medium"
          >
            ← Back to Home
          </Link>
          <h1 className="mt-6 text-4xl font-bold text-gray-900">
            Privacy Policy
          </h1>
          <p className="mt-4 text-gray-500">
            Last updated: January 2026
          </p>
        </div>

        {/* Content */}
        <div className="mt-12 max-w-3xl prose prose-gray prose-lg">
          <Section title="1. Introduction">
            <p>
              SageSet Fitness ("SageSet," "we," "our," or "us"), operated by Workside Software LLC, is committed to
              protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our mobile application and website (collectively, the "Service").
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <h3>2.1 Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide when you:</p>
            <ul>
              <li>Register for an account (name, email address)</li>
              <li>Create or update your profile</li>
              <li>Contact us for support</li>
              <li>Use certain features of the Service</li>
            </ul>

            <h3>2.2 Fitness and Health-Related Data</h3>
            <p>When using SageSet Fitness, we may collect:</p>
            <ul>
              <li>Workout plan details (days, workouts, exercises, sets/reps)</li>
              <li>Workout completion and progress</li>
              <li>Weigh-ins and goal settings</li>
            </ul>
            <p>This data is used to provide core app functionality and help you track progress. Use of AI-generated plans is optional and initiated by you.</p>

            <h3>2.3 Usage and Device Data</h3>
            <p>We automatically collect certain information when you access the Service:</p>
            <ul>
              <li>Device information (device type, operating system)</li>
              <li>Log data (IP address, browser type, access times)</li>
              <li>App usage statistics and diagnostics</li>
            </ul>

            <h3>2.4 Push Notifications</h3>
            <p>
              If you enable notifications, we may collect and store device push tokens to deliver reminders. 
              You can disable notifications in your device settings.
            </p>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve the Service</li>
              <li>Enable core features like plan management and progress tracking</li>
              <li>Send notifications, updates, and administrative messages</li>
              <li>Respond to your questions and requests</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="4. Data Storage and Security">
            <p>
              Your data is stored securely using Firebase, a Google Cloud Platform service. 
              Data is stored in the United States and is subject to Firebase's security measures and privacy policies.
            </p>
            <p>
              We use industry-standard security technologies and procedures to help protect your personal information. 
              However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="5. Third-Party Services">
            <p>We use third-party services that may collect information:</p>
            <ul>
              <li>
                <strong>Firebase (Google)</strong>: Authentication, database, storage, and analytics. 
                See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.
              </li>
              <li>
                <strong>OpenAI</strong>: If you use the AI plan builder, requests are processed through our server-side functions. 
                We do not opt in to allowing OpenAI to use your data to train their models.
              </li>
            </ul>
          </Section>

          <Section title="6. Data Sharing">
            <p>
              We do not sell, trade, or rent your personal information. We may share your information only:
            </p>
            <ul>
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>In connection with a business transfer</li>
              <li>With service providers under strict confidentiality agreements</li>
            </ul>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li>Access and receive a copy of your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent where applicable</li>
            </ul>
            <p>
              To exercise these rights, contact us at{' '}
              <a href="mailto:support@worksidesoftware.com">support@worksidesoftware.com</a>.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              The Service is not intended for users under 18 years of age. We do not knowingly collect 
              personal information from children under 18.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              If you have questions about this Privacy Policy, contact us at:{' '}
              <a href="mailto:support@worksidesoftware.com">support@worksidesoftware.com</a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-12 first:mt-0">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="text-gray-600 leading-relaxed space-y-4 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:text-gray-900 [&>h3]:mt-6 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>p>a]:text-sage-700 [&>p>a]:hover:text-sage-800 [&>ul_a]:text-sage-700 [&>ul_a]:hover:text-sage-800">
        {children}
      </div>
    </section>
  );
}

