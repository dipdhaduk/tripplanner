import Link from 'next/link';
import AiTripWizard from '@/components/trips/AiTripWizard';
import './new-trip.css';

export const metadata = {
  title: 'Plan a Trip with AI | TripPlanner',
  description: 'Generate personalized day-by-day travel itineraries in India with AI assistance.',
};

export default function NewTrip() {
  return (
    <div className="ai-planner-page-wrapper">
      <div className="ai-planner-top-nav">
        <Link className="ai-back-pill" href="/dashboard" aria-label="Return to My Trips">
          <span className="back-arrow" aria-hidden="true">←</span>
          <span>Back to My Trips</span>
        </Link>
        <div className="ai-status-indicator">
          <span className="live-dot" />
          <span>TripPlanner AI Engine Active</span>
        </div>
      </div>

      <AiTripWizard />

      <footer className="ai-planner-page-footer">
        <p>AI itineraries are thoughtfully curated starting points. Verify timings, temple dress codes, permit requirements, and seasonal closures before your journey.</p>
      </footer>
    </div>
  );
}
