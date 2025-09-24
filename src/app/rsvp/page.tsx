'use client';

import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';

function RSVPFormContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              RSVP Form
            </h1>
            <p className="text-gray-600">
              Welcome, {user?.displayName || user?.email}!
            </p>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Your Information</h2>
            <p className="text-sm text-gray-600">
              <strong>Name:</strong> {user?.displayName || 'Not provided'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {user?.email}
            </p>
          </div>

          {/* RSVP Form Placeholder */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Will you be attending?
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="radio" name="attending" value="yes" className="mr-2" />
                  Yes, I&apos;ll be there!
                </label>
                <label className="flex items-center">
                  <input type="radio" name="attending" value="no" className="mr-2" />
                  Sorry, I can&apos;t make it
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of guests
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary restrictions or special requests
              </label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Any allergies, dietary preferences, or special requests..."
              />
            </div>

            <div className="flex gap-4">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Submit RSVP
              </button>
              <button 
                onClick={logout}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RSVPForm() {
  return (
    <AuthGuard>
      <RSVPFormContent />
    </AuthGuard>
  );
}