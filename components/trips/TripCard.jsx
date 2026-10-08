'use client';

import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/dates';
import DestinationPhoto from '@/components/trips/DestinationPhoto';

export default function TripCard({ trip, onDelete }) {
  const start = new Date(`${trip.start_date}T00:00:00`);
  const end = new Date(`${trip.end_date}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const state = end < now ? 'Completed' : start <= now ? 'In progress' : 'Upcoming';
  const fmt = formatDate;
  const imageQuery = trip.legs?.[0]?.destination || trip.destination || trip.trip_name || 'India';
  const routeLabel = trip.legs?.length ? trip.legs.map((leg) => leg.destination).join(' → ') : trip.destination;

  return (
    <article className="trip-card glass trip-card-with-photo">
      <div className="trip-card-media-banner">
        <DestinationPhoto
          destination={imageQuery}
          className="trip-card-photo"
          hideCaption={true}
          altText={`${trip.trip_name} - ${trip.destination}`}
        />
        <div className="trip-card-overlay">
          <span className={`status-pill ${state.toLowerCase().replace(' ', '-')}`}>
            {state}
          </span>
          <span className="trip-card-dest-tag">
            ⌖ {routeLabel}
          </span>
        </div>
      </div>

      <div className="trip-card-body">
        <h3 className="trip-card-title">{trip.trip_name}</h3>
        <p className="trip-date">
          {fmt(start)} <span>→</span> {fmt(end)}
        </p>

        <div className="trip-card-bottom">
          <span className="trip-budget">
            {formatMoney(trip.budget)} <small>budget</small>
          </span>
          <div className="trip-actions">
            <Link className="button button-quiet" href={`/trips/${trip.id}`}>
              Details
            </Link>
            <Link className="button button-quiet" href={`/trips/${trip.id}/edit`}>
              Edit
            </Link>
            {onDelete && (
              <button
                className="button button-quiet danger-text"
                onClick={() => onDelete(trip)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

