/**
 * Typography Demo Component
 * 
 * This component showcases all typography styles in the design system
 * and serves as both a style guide and testing component.
 */

import React from 'react';
import { Typography, combineTypographyClasses } from '@/lib/typography';

interface TypographyDemoProps {
  className?: string;
}

const TypographyDemo: React.FC<TypographyDemoProps> = ({ className = '' }) => {
  return (
    <div className={`max-w-4xl mx-auto p-8 space-y-16 ${className}`}>
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-8">
        <h1 className={Typography.Display.Large}>Typography System</h1>
        <p className={combineTypographyClasses(Typography.UI.Lead, 'mt-4 text-gray-600')}>
          Elegant & Dynamic Wedding Website Design System
        </p>
        <p className={combineTypographyClasses(Typography.Body.Base, 'mt-2 text-gray-500')}>
          Built with TailwindCSS 4, featuring responsive scaling and golden ratio proportions
        </p>
      </div>

      {/* Display Styles */}
      <section>
        <h2 className={combineTypographyClasses(Typography.Heading.H2, 'mb-8 text-gray-800')}>
          Display Styles
        </h2>
        <p className={combineTypographyClasses(Typography.Body.Small, 'mb-6 text-gray-600')}>
          For hero sections, major announcements, and primary focal points
        </p>
        
        <div className="space-y-8">
          <div className="border border-gray-200 p-6 rounded-lg">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-2 text-gray-500')}>
              Display Large (.type-display-1)
            </p>
            <h1 className={Typography.Display.Large}>
              Emma & James
            </h1>
            <code className={combineTypographyClasses(Typography.UI.Caption, 'mt-2 block text-gray-400')}>
              font-family: trajan-pro-3 | clamp(3.5rem, 8vw + 1rem, 8rem) | uppercase
            </code>
          </div>
          
          <div className="border border-gray-200 p-6 rounded-lg">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-2 text-gray-500')}>
              Display Medium (.type-display-2)
            </p>
            <h2 className={Typography.Display.Medium}>
              October 15th, 2024
            </h2>
            <code className={combineTypographyClasses(Typography.UI.Caption, 'mt-2 block text-gray-400')}>
              font-family: trajan-pro-3 | clamp(2.5rem, 6vw + 1rem, 5.5rem) | uppercase
            </code>
          </div>
        </div>
      </section>

      {/* Heading Hierarchy */}
      <section>
        <h2 className={combineTypographyClasses(Typography.Heading.H2, 'mb-8 text-gray-800')}>
          Heading Hierarchy
        </h2>
        <p className={combineTypographyClasses(Typography.Body.Small, 'mb-6 text-gray-600')}>
          Progressive hierarchy from main page headings to minor component headings
        </p>
        
        <div className="space-y-6">
          {[
            { class: Typography.Heading.H1, label: 'Heading 1 (.type-heading-1)', text: 'Our Wedding Story' },
            { class: Typography.Heading.H2, label: 'Heading 2 (.type-heading-2)', text: 'Ceremony Details' },
            { class: Typography.Heading.H3, label: 'Heading 3 (.type-heading-3)', text: 'Reception Information' },
            { class: Typography.Heading.H4, label: 'Heading 4 (.type-heading-4)', text: 'Travel & Accommodations' },
            { class: Typography.Heading.H5, label: 'Heading 5 (.type-heading-5)', text: 'Getting There' },
            { class: Typography.Heading.H6, label: 'Heading 6 (.type-heading-6)', text: 'Parking Information' },
          ].map((heading, index) => (
            <div key={index} className="border-l-4 border-gray-200 pl-4">
              <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-1 text-gray-500')}>
                {heading.label}
              </p>
              <h3 className={heading.class}>
                {heading.text}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* Body Text Styles */}
      <section>
        <h2 className={combineTypographyClasses(Typography.Heading.H2, 'mb-8 text-gray-800')}>
          Body Text Styles
        </h2>
        <p className={combineTypographyClasses(Typography.Body.Small, 'mb-6 text-gray-600')}>
          Reading content with optimal line heights and spacing
        </p>
        
        <div className="space-y-6">
          <div className="border border-gray-200 p-6 rounded-lg">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-2 text-gray-500')}>
              Body Large (.type-body-large)
            </p>
            <p className={Typography.Body.Large}>
              Join us for an unforgettable celebration as we exchange vows in the beautiful coastal town of Tarifa, 
              where the Mediterranean meets the Atlantic and love knows no boundaries.
            </p>
          </div>
          
          <div className="border border-gray-200 p-6 rounded-lg">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-2 text-gray-500')}>
              Body Base (.type-body-base) - Default
            </p>
            <p className={Typography.Body.Base}>
              Our wedding weekend will be filled with joy, laughter, and memories to last a lifetime. 
              From the intimate ceremony overlooking the sea to the lively reception under the stars, 
              every moment has been carefully planned to reflect our love story and create new chapters with you.
            </p>
          </div>
          
          <div className="border border-gray-200 p-6 rounded-lg">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-2 text-gray-500')}>
              Body Small (.type-body-small)
            </p>
            <p className={Typography.Body.Small}>
              Please note that the ceremony will begin promptly at 6:00 PM. We recommend arriving 30 minutes early 
              to enjoy welcome drinks and find your seats. The venue is accessible by car and public transport.
            </p>
          </div>
        </div>
      </section>

      {/* UI & Utility Styles */}
      <section>
        <h2 className={combineTypographyClasses(Typography.Heading.H2, 'mb-8 text-gray-800')}>
          UI & Utility Styles
        </h2>
        <p className={combineTypographyClasses(Typography.Body.Small, 'mb-6 text-gray-600')}>
          Specialized styles for user interface elements and specific content types
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lead Paragraph */}
          <div className="border border-gray-200 p-6 rounded-lg">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-2 text-gray-500')}>
              Lead (.type-lead)
            </p>
            <p className={Typography.UI.Lead}>
              A love story written in the winds of Tarifa, where two hearts became one.
            </p>
          </div>
          
          {/* Quote */}
          <div className="border border-gray-200 p-6 rounded-lg">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-2 text-gray-500')}>
              Quote (.type-quote)
            </p>
            <blockquote className={Typography.UI.Quote}>
              &ldquo;In all the world, there is no heart for me like yours.&rdquo;
            </blockquote>
          </div>
          
          {/* Button Text */}
          <div className="border border-gray-200 p-6 rounded-lg">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-2 text-gray-500')}>
              Button (.type-button)
            </p>
            <button className={combineTypographyClasses(
              Typography.UI.Button, 
              'bg-gray-800 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors'
            )}>
              RSVP Now
            </button>
          </div>
          
          {/* Link */}
          <div className="border border-gray-200 p-6 rounded-lg">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-2 text-gray-500')}>
              Link (.type-link)
            </p>
            <a href="#" className={combineTypographyClasses(Typography.UI.Link, 'text-blue-600')}>
              View our registry
            </a>
          </div>
          
          {/* Label */}
          <div className="border border-gray-200 p-6 rounded-lg">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-2 text-gray-500')}>
              Label (.type-label)
            </p>
            <label className={Typography.UI.Label}>
              Guest Name
            </label>
            <input 
              type="text" 
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              placeholder="Enter your name"
            />
          </div>
          
          {/* Caption */}
          <div className="border border-gray-200 p-6 rounded-lg">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-2 text-gray-500')}>
              Caption (.type-caption)
            </p>
            <div className="bg-gray-200 h-32 rounded-md flex items-center justify-center text-gray-400 mb-2">
              Image Placeholder
            </div>
            <p className={Typography.UI.Caption}>
              Sunset over the Strait of Gibraltar from our ceremony venue
            </p>
          </div>
        </div>
      </section>

      {/* Responsive Demo */}
      <section>
        <h2 className={combineTypographyClasses(Typography.Heading.H2, 'mb-8 text-gray-800')}>
          Responsive Behavior
        </h2>
        <p className={combineTypographyClasses(Typography.Body.Small, 'mb-6 text-gray-600')}>
          All typography scales fluidly using CSS clamp() for optimal readability across devices
        </p>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg">
          <h3 className={Typography.Heading.H1}>
            Resize your browser
          </h3>
          <p className={combineTypographyClasses(Typography.Body.Large, 'mt-4 text-gray-600')}>
            Watch how the typography scales smoothly from mobile to desktop sizes using fluid clamp() functions.
          </p>
          <div className={combineTypographyClasses(Typography.UI.Caption, 'mt-4 text-gray-500')}>
            <strong>Mobile:</strong> 320px - 768px |{' '}
            <strong>Tablet:</strong> 768px - 1024px |{' '}
            <strong>Desktop:</strong> 1024px - 1440px |{' '}
            <strong>Large:</strong> 1440px+
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section>
        <h2 className={combineTypographyClasses(Typography.Heading.H2, 'mb-8 text-gray-800')}>
          Usage Examples
        </h2>
        
        <div className="space-y-6">
          <div className="bg-gray-900 text-white p-6 rounded-lg overflow-x-auto">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-4 text-gray-300')}>
              Basic Usage
            </p>
            <pre className="text-sm text-green-300">
{`import { Typography } from './typography';

// Simple usage
<h1 className={Typography.Display.Large}>
  Wedding Announcement
</h1>

// With additional classes
<p className={\`\${Typography.Body.Base} text-gray-600 mt-4\`}>
  Content here
</p>`}
            </pre>
          </div>
          
          <div className="bg-gray-900 text-white p-6 rounded-lg overflow-x-auto">
            <p className={combineTypographyClasses(Typography.UI.Overline, 'mb-4 text-gray-300')}>
              Using Helper Function
            </p>
            <pre className="text-sm text-green-300">
{`import { Typography, combineTypographyClasses } from './typography';

<h2 className={combineTypographyClasses(
  Typography.Heading.H2, 
  'text-center text-gray-800 mb-8'
)}>
  Section Title
</h2>`}
            </pre>
          </div>
        </div>
      </section>

      {/* Performance & Accessibility Notes */}
      <section className="bg-blue-50 p-6 rounded-lg">
        <h2 className={combineTypographyClasses(Typography.Heading.H3, 'mb-4 text-blue-900')}>
          Performance & Accessibility
        </h2>
        <ul className={combineTypographyClasses(Typography.Body.Small, 'space-y-2 text-blue-800')}>
          <li>• Respects <code>prefers-reduced-motion</code> for users with motion sensitivity</li>
          <li>• Supports <code>prefers-contrast: high</code> mode for enhanced visibility</li>
          <li>• Optimized font rendering with antialiasing and ligatures</li>
          <li>• Print styles included for excellent printed output</li>
          <li>• WCAG 2.1 compliant contrast ratios when used with appropriate colors</li>
          <li>• Fluid scaling prevents text from becoming too small on mobile devices</li>
        </ul>
      </section>
    </div>
  );
};

export default TypographyDemo; 