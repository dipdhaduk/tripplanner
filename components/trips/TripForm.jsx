'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function TripForm({ initial, tripId }) {
  const isMultiCity = Array.isArray(initial?.legs) && initial.legs.length > 1;
  const [form, setForm] = useState({
    trip_name: initial?.trip_name || '',
    destination: initial?.destination || '',
    start_date: initial?.start_date?.slice(0, 10) || '',
    end_date: initial?.end_date?.slice(0, 10) || '',
    budget: initial?.budget ?? '',
    notes: initial?.notes || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.trip_name.trim() || !form.destination.trim() || !form.start_date || !form.end_date) {
      setError('Complete all required fields.');
      return;
    }
    if (form.end_date < form.start_date) {
      setError('End date cannot be before start date.');
      return;
    }
    if (form.budget !== '' && (!Number.isFinite(Number(form.budget)) || Number(form.budget) < 0)) {
      setError('Enter a valid budget.');
      return;
    }

    setBusy(true);
    try {
      if (tripId) await api.put(`/trips/${tripId}`, form);
      else await api.post('/trips', form);
      router.push('/dashboard');
      router.refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save this trip.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-card glass" onSubmit={submit}>
      {isMultiCity && <div className="multi-city-edit-note">This is a multi-city route. Its stops and travel dates are kept together, so edit those in the itinerary.</div>}
      <div className="form-grid">
        <label className="field full">Trip name<input name="trip_name" value={form.trip_name} onChange={change} maxLength={120} required placeholder="A week in Rajasthan" /></label>
        <label className="field full">{isMultiCity ? 'Route' : 'Destination'}<input name="destination" value={form.destination} onChange={change} maxLength={160} required disabled={isMultiCity} placeholder="Jaipur, Rajasthan" /></label>
        <label className="field">Start date<input type="date" name="start_date" value={form.start_date} onChange={change} required disabled={isMultiCity} /></label>
        <label className="field">End date<input type="date" name="end_date" value={form.end_date} onChange={change} min={form.start_date || undefined} required disabled={isMultiCity} /></label>
        <label className="field full">Estimated budget <span className="field-hint">INR</span><input type="number" min="0" step="0.01" name="budget" value={form.budget} onChange={change} placeholder="e.g. 48,000" /></label>
        <label className="field full">Notes<textarea name="notes" value={form.notes} onChange={change} rows="4" maxLength={5000} placeholder="Reservations, ideas, reminders…" /></label>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="form-footer">
        <button className="button button-quiet" type="button" onClick={() => router.back()}>Cancel</button>
        <button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : tripId ? 'Save changes' : 'Create trip'}</button>
      </div>
    </form>
  );
}
