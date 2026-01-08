import { Link } from 'react-router-dom';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function SupportPage() {
  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Use the "Forgot Password" link on the login screen. If you still need help, email us.'
    },
    {
      question: 'How do I delete my account?',
      answer: 'You can delete your account from within the app settings, or contact us for assistance.'
    },
    {
      question: 'How do I generate an AI workout plan?',
      answer: 'In the app, go to Plans and use the AI Plan Builder. You can customize and save the plan once generated.'
    },
    {
      question: 'How do I track today\'s workout?',
      answer: 'Open the Today tab, tap an exercise to mark sets as complete, and watch your progress update.'
    },
    {
      question: 'Where do I log a weigh-in?',
      answer: 'Open Weigh-ins and tap Add. Your most recent entry will appear at the top.'
    },
    {
      question: 'How does the calendar work?',
      answer: 'The Calendar shows your planned and completed workouts. Tap any day to view details.'
    },
  ];

  return (
    <div className="bg-white">
      <div className="max-w-content mx-auto px-6 py-16 lg:py-24">
        {/* Header */}
        <div className="max-w-2xl">
          <Link 
            to="/" 
            className="text-sage-600 hover:text-sage-700 text-sm font-medium"
          >
            ← Back to Home
          </Link>
          <h1 className="mt-6 text-4xl font-bold text-gray-900">
            Support
          </h1>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            We're here to help. Find answers below or get in touch.
          </p>
        </div>

        {/* Contact */}
        <div className="mt-12 p-8 bg-sage-50 rounded-2xl max-w-2xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-sage-100 rounded-xl flex items-center justify-center">
              <EnvelopeIcon className="w-5 h-5 text-sage-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Email Support</h2>
              <a 
                href="mailto:support@worksidesoftware.com" 
                className="mt-1 text-sage-700 hover:text-sage-800 font-medium text-lg"
              >
                support@worksidesoftware.com
              </a>
              <p className="mt-2 text-gray-600">
                We typically respond within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-16 max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-gray-900">
                  {faq.question}
                </h3>
                <p className="mt-2 text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="mt-16 pt-8 border-t border-gray-100 max-w-2xl">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Legal
          </h3>
          <div className="mt-4 flex gap-6">
            <Link
              to="/privacy"
              className="text-sage-700 hover:text-sage-800 font-medium"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-sage-700 hover:text-sage-800 font-medium"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

