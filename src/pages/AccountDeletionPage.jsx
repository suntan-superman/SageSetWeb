import { Link } from 'react-router-dom';

export default function AccountDeletionPage() {
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
            Account & Data Deletion
          </h1>
          <p className="mt-4 text-gray-500">
            How to delete your SageSet account and associated data
          </p>
        </div>

        {/* Content */}
        <div className="mt-12 max-w-3xl prose prose-gray prose-lg">
          <p className="lead">
            SageSet users may request deletion of their account and associated data in the following ways:
          </p>

          <Section title="Option 1: In-App Account Deletion">
            <ol>
              <li>Open the SageSet mobile app</li>
              <li>Go to <strong>Settings</strong></li>
              <li>Select <strong>Delete Account</strong></li>
              <li>Confirm the deletion request</li>
            </ol>
            <p>
              This will permanently delete your SageSet account and associated personal data.
            </p>
          </Section>

          <Section title="Option 2: Request Deletion by Email">
            <p>
              If you are unable to access the app, you may request account deletion by contacting:
            </p>
            <p className="text-lg">
              📧 <a href="mailto:support@sagesetfitness.com" className="text-sage-600 hover:text-sage-700">
                support@sagesetfitness.com
              </a>
            </p>
            <p>Please include:</p>
            <ul>
              <li>The email address associated with your SageSet account</li>
              <li>The words <strong>"Account Deletion Request"</strong> in the subject line</li>
            </ul>
          </Section>

          <Section title="Data That Is Deleted">
            <ul>
              <li>User account credentials (email, authentication identifiers)</li>
              <li>Workout and fitness activity data</li>
              <li>App usage data associated with your account</li>
            </ul>
          </Section>

          <Section title="Data That May Be Retained">
            <ul>
              <li>Aggregated or anonymized analytics data (non-identifiable)</li>
            </ul>
          </Section>

          <Section title="Retention Period">
            <ul>
              <li>Account and associated data are deleted within <strong>30 days</strong> of request</li>
              <li>Some data may be retained longer if required by law or for security purposes</li>
            </ul>
          </Section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500">
              If you have any questions about account deletion, please contact us at{' '}
              <a href="mailto:support@sagesetfitness.com" className="text-sage-600 hover:text-sage-700">
                support@sagesetfitness.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
