import React from 'react';

import { COPYRIGHT_NOTICE } from '../constants/appInfo';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl px-4 py-12 mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-block mb-4 text-green-600 hover:text-green-700"
          >
            ← Back to Home
          </Link>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 bg-white rounded-lg shadow-sm">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              1. Introduction
            </h2>
            <p className="leading-relaxed text-gray-700">
              SageSet Fitness ("SageSet," "we," "our," or "us"), operated by Workside Software LLC, is committed to
              protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our mobile application and website (collectively, the "Service").
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-xl font-medium text-gray-900">
                  2.1 Personal Information
                </h3>
                <p className="leading-relaxed text-gray-700">
                  We may collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="mt-2 ml-4 space-y-1 text-gray-700 list-disc list-inside">
                  <li>Register for an account (name, email address)</li>
                  <li>Create or update your profile</li>
                  <li>Contact us for support</li>
                  <li>Use certain features of the Service</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-medium text-gray-900">
                  2.2 Fitness and Health-Related Data
                </h3>
                <p className="leading-relaxed text-gray-700">
                  When using SageSet Fitness, we may collect:
                </p>
                <ul className="mt-2 ml-4 space-y-1 text-gray-700 list-disc list-inside">
                  <li>Workout plan details (days, workouts, exercises, sets/reps)</li>
                  <li>Workout completion and progress (e.g., completed sets/exercises)</li>
                  <li>Weigh-ins and goal settings (e.g., target weight, timelines)</li>
                </ul>
                <p className="mt-2 leading-relaxed text-gray-700">
                  This data is used to provide core app functionality and to help you track progress.
                </p>
                <p className="mt-2 leading-relaxed text-gray-700">
                  Use of AI-generated plans is optional and initiated by the user.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-medium text-gray-900">
                  2.3 Usage and Device Data
                </h3>
                <p className="leading-relaxed text-gray-700">
                  We automatically collect certain information when you access and use the Service, including:
                </p>
                <ul className="mt-2 ml-4 space-y-1 text-gray-700 list-disc list-inside">
                  <li>Device information (device type, operating system)</li>
                  <li>Log data (IP address, browser type, access times, pages viewed)</li>
                  <li>App usage statistics and diagnostics</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-medium text-gray-900">
                  2.4 Push Notifications
                </h3>
                <p className="leading-relaxed text-gray-700">
                  If you enable notifications, we may collect and store device push tokens to deliver reminders and
                  updates. You can disable notifications in your device settings.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              3. How We Use Your Information
            </h2>
            <p className="mb-2 leading-relaxed text-gray-700">
              We use the information we collect to:
            </p>
            <ul className="ml-4 space-y-1 text-gray-700 list-disc list-inside">
              <li>Provide, maintain, and improve the Service</li>
              <li>Provide core features like plan management, progress tracking, and reminders</li>
              <li>Send you notifications, updates, and administrative messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Comply with legal obligations</li>
              <li>Protect the rights, property, and safety of our users and others</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              4. Data Storage and Security
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-xl font-medium text-gray-900">
                  4.1 Data Storage
                </h3>
                <p className="leading-relaxed text-gray-700">
                  Your data is stored securely using Firebase, a Google Cloud Platform service. 
                  Data is stored in the United States and is subject to Firebase's security measures 
                  and privacy policies. We implement appropriate technical and organizational measures 
                  to protect your personal information.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-medium text-gray-900">
                  4.2 Security Measures
                </h3>
                <p className="leading-relaxed text-gray-700">
                  We use industry-standard security technologies and procedures to help protect your 
                  personal information from unauthorized access, use, or disclosure. However, no method 
                  of transmission over the Internet or electronic storage is 100% secure, and we cannot 
                  guarantee absolute security.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              5. Third-Party Services
            </h2>
            <p className="mb-2 leading-relaxed text-gray-700">
              We use third-party services that may collect information used to identify you:
            </p>
            <ul className="ml-4 space-y-2 text-gray-700 list-disc list-inside">
              <li>
                <strong>Firebase (Google)</strong>: Authentication, database, storage, and analytics services. 
                See Google's Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">https://policies.google.com/privacy</a>
              </li>
              <li>
                <strong>OpenAI (via Cloud Functions)</strong>: If you use the AI plan builder, requests are processed
                through our server-side functions to protect API keys. 
                We do not opt in to allowing OpenAI to use submitted data to train or improve their models.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              6. Data Sharing and Disclosure
            </h2>
            <p className="mb-2 leading-relaxed text-gray-700">
              We do not sell, trade, or rent your personal information to third parties. We may share 
              your information only in the following circumstances:
            </p>
            <ul className="ml-4 space-y-1 text-gray-700 list-disc list-inside">
              <li>With your consent</li>
              <li>To comply with legal obligations or respond to lawful requests</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>In connection with a business transfer (merger, acquisition, etc.)</li>
              <li>With service providers who assist us in operating the Service (under strict confidentiality agreements)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              7. Your Rights and Choices
            </h2>
            <p className="mb-2 leading-relaxed text-gray-700">
              You have the right to:
            </p>
            <ul className="ml-4 space-y-1 text-gray-700 list-disc list-inside">
              <li>Access and receive a copy of your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict processing of your information</li>
              <li>Withdraw consent at any time (where processing is based on consent)</li>
              <li>Disable push notifications through your device settings</li>
              <li>Opt out of certain communications</li>
            </ul>
            <p className="mt-4 leading-relaxed text-gray-700">
              To exercise these rights, please contact us at the email address provided below.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              8. Children's Privacy
            </h2>
            <p className="leading-relaxed text-gray-700">
              The Service is not intended for individuals under the age of 18. We do not knowingly 
              collect personal information from children. If you become aware that a child has provided 
              us with personal information, please contact us, and we will take steps to delete such 
              information.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              9. Changes to This Privacy Policy
            </h2>
            <p className="leading-relaxed text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date. 
              You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              10. Contact Us
            </h2>
            <p className="leading-relaxed text-gray-700">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-gray-700">
                <strong>Email:</strong> <a href="mailto:support@worksidesoftware.com" className="text-green-600 hover:text-green-700">support@worksidesoftware.com</a>
              </p>
              <p className="text-gray-700">
                <strong>Service:</strong> SageSet Fitness
              </p>
              <p className="text-gray-700">
                <strong>Company:</strong> Workside Software LLC
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-sm text-center text-gray-600">
          <p>{COPYRIGHT_NOTICE}</p>
        </div>
      </div>
    </div>
  );
}

