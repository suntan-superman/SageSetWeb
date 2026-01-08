import { Link } from 'react-router-dom';

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="mt-4 text-gray-500">
            Last updated: January 2026
          </p>
        </div>

        {/* Content */}
        <div className="mt-12 max-w-3xl">
          <Section title="1. Agreement to Terms">
            <p>
              By accessing or using the SageSet Fitness platform (the "Service"), operated by 
              Workside Software LLC ("SageSet," "we," "us," or "our"), you agree to be bound by these 
              Terms of Service. If you do not agree, you may not access or use the Service.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              SageSet Fitness is a personal fitness planner designed to help you create workout plans,
              track completion, view workouts on a calendar, log weigh-ins, and optionally generate 
              AI-powered plans.
            </p>
            <p>Features include:</p>
            <ul>
              <li>Workout plans and daily schedules</li>
              <li>Workout completion tracking</li>
              <li>Calendar view with activity indicators</li>
              <li>Weigh-ins and goals</li>
              <li>AI plan generation (optional)</li>
            </ul>
          </Section>

          <Section title="3. Account Registration">
            <h3>3.1 Account Creation</h3>
            <p>
              To use the Service, you must create an account with accurate and complete information. 
              You are responsible for maintaining the confidentiality of your credentials and for all 
              activities under your account.
            </p>

            <h3>3.2 Account Security</h3>
            <p>You agree to:</p>
            <ul>
              <li>Immediately notify us of any unauthorized use</li>
              <li>Use a strong password and keep it secure</li>
              <li>Not share your account credentials</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h3>3.3 Age Requirement</h3>
            <p>
              You must be at least 18 years old to use the Service. By using the Service, you represent 
              that you meet this requirement.
            </p>
          </Section>

          <Section title="4. Subscription and Payment">
            <p>
              The Service may be offered for free or with paid features. If we offer subscriptions, 
              details including pricing will be presented in the app at the time of purchase.
            </p>
            <ul>
              <li>Paid features may be billed in advance on a recurring basis</li>
              <li>All fees are non-refundable except as required by law or app store policies</li>
              <li>We reserve the right to change fees with reasonable advance notice</li>
              <li>You may cancel subscriptions through the platform where you purchased them</li>
            </ul>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree not to:</p>
            <ul>
              <li>Violate any laws, regulations, or third-party rights</li>
              <li>Send spam or engage in harassment</li>
              <li>Upload malicious code or harmful content</li>
              <li>Attempt unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Impersonate any person or entity</li>
              <li>Collect data from the Service without permission</li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property">
            <h3>6.1 Our Property</h3>
            <p>
              The Service and its content, features, and functionality are owned by Workside Software LLC 
              and protected by international intellectual property laws.
            </p>

            <h3>6.2 Your Content</h3>
            <p>
              You retain ownership of content you upload (e.g., workout plans, notes). By uploading content, 
              you grant us a worldwide, non-exclusive, royalty-free license to use it solely for providing 
              the Service to you.
            </p>
          </Section>

          <Section title="7. Health Disclaimer">
            <p>
              <strong>SageSet Fitness is not medical advice.</strong> The Service provides general fitness 
              information and tools. Always consult your physician before beginning any new exercise program, 
              especially if you have any medical conditions.
            </p>
            <p>
              We are not responsible for any injuries, health issues, or other damages that may result from 
              your use of the Service.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, Workside Software LLC shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages, or any loss of profits, 
              data, or goodwill.
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              We may terminate or suspend your account at our discretion, without notice, for conduct 
              that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately cease. You may request 
              deletion of your data by contacting us.
            </p>
          </Section>

          <Section title="10. Changes to Terms">
            <p>
              We may update these Terms from time to time. We will notify you of material changes by 
              posting the new Terms on this page. Your continued use of the Service after changes 
              constitutes acceptance of the new Terms.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These Terms shall be governed by the laws of the State of North Carolina, without regard 
              to its conflict of law provisions.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have questions about these Terms, contact us at:{' '}
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
      <div className="text-gray-600 leading-relaxed space-y-4 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:text-gray-900 [&>h3]:mt-6 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>p>a]:text-sage-700 [&>p>a]:hover:text-sage-800 [&>p>strong]:text-gray-900">
        {children}
      </div>
    </section>
  );
}
