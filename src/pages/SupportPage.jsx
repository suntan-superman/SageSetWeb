import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  EnvelopeIcon, 
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

import { COPYRIGHT_NOTICE } from '../constants/appInfo';

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const subject = encodeURIComponent(`[SageSet Fitness] ${formData.subject}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
      );
      window.location.href = `mailto:support@worksidesoftware.com?subject=${subject}&body=${body}`;
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error submitting support request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      // Clear status after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    }
  };

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Use the “Forgot Password” link on the login screen. If you still need help, email support@worksidesoftware.com.'
    },
    {
      question: 'How do I delete my account?',
      answer: 'You can delete your account from within the app settings. If you need assistance, contact support@worksidesoftware.com.'
    },
    {
      question: 'How do I generate an AI workout plan?',
      answer: 'In the app, go to Plans and use the AI Plan Builder. You can save and activate the plan once it looks right.'
    },
    {
      question: 'How do I track today’s workout?',
      answer: 'Open the Today tab, tap an exercise to mark sets completed, and watch the progress update.'
    },
    {
      question: 'Where do I log a weigh-in?',
      answer: 'Open Weigh-ins and tap Add. Your most recent weigh-in appears at the top.'
    },
    {
      question: 'How does the calendar work?',
      answer: 'The Calendar shows planned and completed workouts. Tap a day to view details.'
    },
    {
      question: 'How do I contact support?',
      answer: 'Email support@worksidesoftware.com and include your account email, device model, and a short description of the issue.'
    }
  ];

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
            Support & Help Center
          </h1>
          <p className="text-gray-600">
            Get help with SageSet Fitness
          </p>
        </div>

        {/* Contact Methods */}
        <div className="p-8 mb-8 bg-white rounded-lg shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            Contact Us
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex items-start">
              <EnvelopeIcon className="flex-shrink-0 w-6 h-6 mt-1 mr-3 text-green-600" />
              <div>
                <h3 className="mb-1 font-medium text-gray-900">Email Support</h3>
                <a 
                  href="mailto:support@worksidesoftware.com" 
                  className="text-green-600 hover:text-green-700"
                >
                  support@worksidesoftware.com
                </a>
                <p className="mt-1 text-sm text-gray-600">
                  We typically respond within 24 hours
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <DocumentTextIcon className="flex-shrink-0 w-6 h-6 mt-1 mr-3 text-green-600" />
              <div>
                <h3 className="mb-1 font-medium text-gray-900">Documentation</h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <Link
                    to="/privacy"
                    className="text-green-600 hover:text-green-700"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/terms"
                    className="text-green-600 hover:text-green-700"
                  >
                    Terms of Use
                  </Link>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Review our privacy policy and terms
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="p-8 mb-8 bg-white rounded-lg shadow-sm">
          <h2 className="flex items-center mb-6 text-2xl font-semibold text-gray-900">
            <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-green-600" />
            Send Us a Message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                  Your Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="block mb-1 text-sm font-medium text-gray-700">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Password Reset, Feature Request, Bug Report"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label htmlFor="message" className="block mb-1 text-sm font-medium text-gray-700">
                Message *
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Please describe your issue or question in detail..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            {submitStatus === 'success' && (
              <div className="p-3 text-sm text-green-800 border border-green-200 rounded-md bg-green-50">
                ✓ Your email app should open. If it doesn't, email us at support@worksidesoftware.com.
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="p-3 text-sm text-red-800 border border-red-200 rounded-md bg-red-50">
                ✗ There was an error. Please email us directly at support@worksidesoftware.com
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-2 text-white bg-green-600 rounded-md md:w-auto hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Opening Email...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="p-8 bg-white rounded-lg shadow-sm">
          <h2 className="flex items-center mb-6 text-2xl font-semibold text-gray-900">
            <QuestionMarkCircleIcon className="w-6 h-6 mr-2 text-green-600" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="pb-4 border-b border-gray-200 last:border-b-0">
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  {faq.question}
                </h3>
                <p className="leading-relaxed text-gray-700">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="p-8 mt-8 bg-white rounded-lg shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link 
              to="/" 
              className="p-4 transition-colors border border-gray-200 rounded-md hover:border-green-500 hover:bg-green-50"
            >
              <h3 className="mb-1 font-medium text-gray-900">Home</h3>
              <p className="text-sm text-gray-600">Learn about SageSet Fitness</p>
            </Link>
            <Link 
              to="/privacy" 
              className="p-4 transition-colors border border-gray-200 rounded-md hover:border-green-500 hover:bg-green-50"
            >
              <h3 className="mb-1 font-medium text-gray-900">Privacy Policy</h3>
              <p className="text-sm text-gray-600">Learn how we protect your data and privacy</p>
            </Link>
            <Link 
              to="/terms" 
              className="p-4 transition-colors border border-gray-200 rounded-md hover:border-green-500 hover:bg-green-50"
            >
              <h3 className="mb-1 font-medium text-gray-900">Terms of Use</h3>
              <p className="text-sm text-gray-600">Review terms for using SageSet Fitness</p>
            </Link>
            <a 
              href="mailto:support@worksidesoftware.com" 
              className="p-4 transition-colors border border-gray-200 rounded-md hover:border-green-500 hover:bg-green-50"
            >
              <h3 className="mb-1 font-medium text-gray-900">Email Support</h3>
              <p className="text-sm text-gray-600">Get help from our support team</p>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-sm text-center text-gray-600">
          <p>{COPYRIGHT_NOTICE}</p>
        </div>
      </div>
    </div>
  );
}

