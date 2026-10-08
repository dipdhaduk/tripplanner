'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import Loader from '@/components/ui/Loader';
import EmptyState from '@/components/ui/EmptyState';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/dates';
import DestinationPhoto from '@/components/trips/DestinationPhoto';

const initial = { trip_id: '', day_number: 1, activity: '', location: '', activity_date: '', start_time: '', end_time: '', notes: '' };
const emptyItinerary = [];

function getActivityCategory(activity) {
  const text = String(activity || '').toLowerCase();
  if (/flight|airport|train|rail|bus|taxi|cab|transfer|drive|depart|station/.test(text)) return { type: 'transit', icon: '✈', label: 'Transit' };
  if (/hotel|check[ -]?in|checkout|stay|resort|hostel|lodge|accommodation/.test(text)) return { type: 'stay', icon: '⌂', label: 'Stay' };
  if (/food|cafe|café|restaurant|breakfast|brunch|lunch|dinner|tasting|street food|tea|chai/.test(text)) return { type: 'food', icon: '♨', label: 'Food / cafe' };
  return { type: 'sightseeing', icon: '⌖', label: 'Sightseeing' };
}

function daysBetween(start, end) {
  return Math.max(0, Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000));
}

function makeLegs(trip, itinerary) {
  const legs = Array.isArray(trip.legs) && trip.legs.length
    ? trip.legs
    : [{ leg_number: 1, destination: trip.destination, start_date: trip.start_date, end_date: trip.end_date, summary: trip.summary || '', arrival: '', transfer: '', stay: '', estimated_budget_inr: trip.budget }];
  let firstDay = 1;
  return legs.map((leg, index) => {
    const legDays = daysBetween(leg.start_date, leg.end_date) + 1;
    const startDay = firstDay;
    const endDay = startDay + legDays - 1;
    firstDay = endDay + 1;
    const activities = itinerary.filter((item) => {
      if (Number.isInteger(item.leg_number)) return item.leg_number === (leg.leg_number || index + 1);
      if (item.activity_date) return item.activity_date >= leg.start_date && item.activity_date <= leg.end_date;
      return item.day_number >= startDay && item.day_number <= endDay;
    });
    const days = {};
    activities.forEach((item) => (days[item.day_number] ??= []).push(item));
    return { ...leg, leg_number: leg.leg_number || index + 1, start_day: startDay, end_day: endDay, nights: daysBetween(leg.start_date, leg.end_date), days };
  });
}

function ActivityCard({ item, onEdit, onRemove }) {
  const category = getActivityCategory(item.activity);
  return (
    <article className="activity-card glass">
      <span className="activity-time">{item.start_time?.slice(0, 5) || '—'}</span>
      <div className="activity-copy">
        <div className="activity-title-row">
          <h3>{item.activity}</h3>
          <span className={`activity-badge activity-${category.type}`}><span aria-hidden="true">{category.icon}</span>{category.label}</span>
        </div>
        {item.location && <p>⌖ {item.location}</p>}
        {item.notes && <small>{item.notes}</small>}
      </div>
      <button className="button button-quiet" onClick={() => onEdit(item)}>Edit</button>
      <button className="button button-quiet danger-text" onClick={() => onRemove(item)}>Remove</button>
    </article>
  );
}

export default function TripDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initial);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get(`/trips/${id}`);
      setError('');
      setData(response.data.data);
      setForm((value) => ({ ...value, trip_id: id }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load this trip.');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function add(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, trip_id: Number(id) };
      if (editId) await api.put(`/itineraries/${editId}`, payload);
      else await api.post('/itineraries', payload);
      setEditId(null);
      setForm({ ...initial, trip_id: id });
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save activity.');
    } finally {
      setBusy(false);
    }
  }

  function edit(item) {
    setEditId(item.id);
    setForm({
      trip_id: id, day_number: item.day_number, activity: item.activity, location: item.location || '',
      activity_date: item.activity_date?.slice(0, 10) || '', start_time: item.start_time?.slice(0, 5) || '',
      end_time: item.end_time?.slice(0, 5) || '', notes: item.notes || '',
    });
    document.getElementById('activity-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.activity}” from this itinerary?`)) return;
    try {
      await api.delete(`/itineraries/${item.id}`);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete activity.');
    }
  }

  const trip = data?.trip;
  const itinerary = data?.itinerary || emptyItinerary;
  const legs = useMemo(() => (trip ? makeLegs(trip, itinerary) : []), [trip, itinerary]);
  const start = trip ? new Date(`${trip.start_date}T00:00:00`) : null;
  const end = trip ? new Date(`${trip.end_date}T00:00:00`) : null;
  const dayCount = trip ? daysBetween(trip.start_date, trip.end_date) + 1 : 0;

  if (error && !data) return <div className="page-shell"><div className="error-box">{error}<button className="button button-quiet" onClick={load}>Try again</button></div></div>;
  if (!data) return <div className="page-shell"><Loader label="Loading trip…" /></div>;

  return (
    <div className="page-shell trip-details-page">
      <Link className="back-link" href="/dashboard">← All trips</Link>
      <section className="trip-hero glass multicity-hero">
        <DestinationPhoto destination={legs[0]?.destination || trip.destination} className="trip-hero-image" priority />
        <div className="multicity-hero-copy">
          <span className="eyebrow">YOUR ROUTE · {legs.length} {legs.length === 1 ? 'STOP' : 'STOPS'} · {dayCount} DAYS</span>
          <h1>{trip.trip_name}</h1>
          <p className="trip-hero-dest">{legs.map((leg) => leg.destination).join('  →  ')}</p>
          <p className="trip-date">{formatDate(trip.start_date)} <span>→</span> {formatDate(trip.end_date)}</p>
          <nav className="route-anchors" aria-label="Trip destinations">
            {legs.map((leg, index) => <a key={leg.leg_number} href={`#destination-${leg.leg_number}`}><span>{String(index + 1).padStart(2, '0')}</span>{leg.destination}</a>)}
          </nav>
        </div>
        <Link className="button button-secondary multicity-edit" href={`/trips/${id}/edit`}>Edit trip ↗</Link>
        <div className="trip-hero-note">{formatMoney(trip.budget)}<small>{trip.budget_source === 'user-budget' ? 'your trip budget' : 'estimated trip budget'}</small></div>
      </section>

      {trip.summary && <section className="route-summary glass"><span className="eyebrow">THE JOURNEY</span><p>{trip.summary}</p></section>}
      {error && <div className="error-box">{error}</div>}

      {legs.map((leg, index) => (
        <section className="destination-leg" id={`destination-${leg.leg_number}`} key={leg.leg_number}>
          <header className="destination-leg-heading">
            <div className="destination-leg-number">{String(index + 1).padStart(2, '0')}</div>
            <DestinationPhoto destination={leg.destination} className="destination-leg-photo" hideCaption altText={`${leg.destination} travel destination`} />
            <div className="destination-leg-title">
              <span className="eyebrow">STOP {index + 1} · DAYS {leg.start_day}–{leg.end_day}</span>
              <h2>{leg.destination}</h2>
              <p>{formatDate(leg.start_date)} – {formatDate(leg.end_date)} <span>·</span> {leg.nights} {leg.nights === 1 ? 'night' : 'nights'}</p>
            </div>
            {leg.estimated_budget_inr > 0 && <div className="leg-budget">{formatMoney(leg.estimated_budget_inr)}<small>estimated for this stop</small></div>}
          </header>

          {leg.summary && <p className="destination-leg-summary">{leg.summary}</p>}

          {(leg.arrival || leg.transfer || leg.stay) && (
            <div className="leg-logistics-grid">
              {leg.arrival && <article className="logistics-card logistics-transit"><span className="logistics-icon">↗</span><div><span className="eyebrow">ARRIVE</span><p>{leg.arrival}</p></div></article>}
              {leg.transfer && <article className="logistics-card logistics-transfer"><span className="logistics-icon">⌖</span><div><span className="eyebrow">GETTING AROUND</span><p>{leg.transfer}</p></div></article>}
              {leg.stay && <article className="logistics-card logistics-stay"><span className="logistics-icon">⌂</span><div><span className="eyebrow">WHERE TO STAY</span><p>{leg.stay}</p></div></article>}
            </div>
          )}

          <div className="leg-itinerary-heading"><div><span className="eyebrow">ON THE GROUND</span><h3>Day-by-day itinerary</h3></div><span>{Object.keys(leg.days).length} days planned</span></div>
          {Object.keys(leg.days).length === 0 ? (
            <EmptyState title="No activities yet" description="Add an activity to start shaping this stop." />
          ) : Object.entries(leg.days).sort((a, b) => Number(a[0]) - Number(b[0])).map(([day, items]) => {
            const date = items.find((item) => item.activity_date)?.activity_date;
            return (
              <div className="multi-day-row" key={`${leg.leg_number}-${day}`}>
                <div className="multi-day-label"><strong>DAY {String(day).padStart(2, '0')}</strong>{date && <span>{formatDate(date)}</span>}</div>
                <div className="activity-list">{items.map((item) => <ActivityCard key={item.id} item={item} onEdit={edit} onRemove={remove} />)}</div>
              </div>
            );
          })}
        </section>
      ))}

      {legs.some((leg) => leg.arrival || leg.transfer || leg.stay) && <p className="estimate-disclaimer">Travel, transfer and stay details are AI suggestions with approximate budgets. They are not live quotes or bookings; check routes, dates and prices before you travel.</p>}

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">ADD A STOP</span><h2>{editId ? 'Edit activity' : 'Build your itinerary'}</h2></div></div>
        <form id="activity-form" className="form-card glass" onSubmit={add}>
          <div className="form-grid">
            <label className="field full">Activity<input required maxLength="200" placeholder="Visit the old town" value={form.activity} onChange={(event) => setForm({ ...form, activity: event.target.value })} /></label>
            <label className="field full">Location<input maxLength="200" placeholder="Optional" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
            <label className="field">Day number<input type="number" min="1" max={dayCount} value={form.day_number} onChange={(event) => setForm({ ...form, day_number: event.target.value })} /></label>
            <label className="field">Date<input type="date" min={trip.start_date} max={trip.end_date} value={form.activity_date} onChange={(event) => setForm({ ...form, activity_date: event.target.value })} /></label>
            <label className="field">Start time<input type="time" value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} /></label>
            <label className="field">End time<input type="time" value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} /></label>
            <label className="field full">Notes<textarea rows="3" maxLength="2000" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Anything to remember?" /></label>
          </div>
          {error && <div className="error-box">{error}</div>}
          <div className="form-footer">
            {editId && <button type="button" className="button button-quiet" onClick={() => { setEditId(null); setForm({ ...initial, trip_id: id }); }}>Cancel edit</button>}
            <button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : editId ? 'Save activity' : 'Add activity'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
