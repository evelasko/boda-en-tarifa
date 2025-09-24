'use client';

import React from 'react';
import { RSVPResponse } from '@/types/rsvp';

interface FormProgressProps {
  responses: Partial<RSVPResponse>;
  className?: string;
}

export function FormProgress({ responses, className }: FormProgressProps) {
  const totalQuestions = 7;
  let completedQuestions = 0;

  // Question 1: Attendance
  if (responses.attendance) completedQuestions++;

  // Question 2: Accommodation management
  if (responses.accommodationManagement) completedQuestions++;

  // Question 3: Nights staying
  if (responses.nightsStaying && responses.nightsStaying.length > 0) {
    completedQuestions++;
  }

  // Question 4: Room sharing
  if (responses.roomSharing?.trim()) completedQuestions++;

  // Question 5: Transportation needs
  if (responses.transportationNeeds && responses.transportationNeeds.length > 0) {
    completedQuestions++;
  }

  // Question 6: Dietary restrictions (optional, but counts if filled)
  if (responses.dietaryRestrictions?.trim()) completedQuestions++;

  // Question 7: Main course preference
  if (responses.mainCoursePreference) completedQuestions++;

  const progressPercentage = (completedQuestions / totalQuestions) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Progreso del formulario</span>
        <span>{completedQuestions}/{totalQuestions} preguntas</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
