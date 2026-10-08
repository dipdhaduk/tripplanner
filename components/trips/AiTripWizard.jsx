'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import DestinationPhoto from '@/components/trips/DestinationPhoto';

const questions = [
  {
    stepNumber: '01',
    title: 'Where would you like to travel?',
    subtitle: 'Choose an iconic Indian destination or let AI surprise you with a hidden gem.',
    checkTitle: 'DESTINATION',
    checklistHelper: 'Select your destination',
    hint: 'e.g. Jaipur, Kerala, Ladakh, Goa',
  },
  {
    stepNumber: '02',
    title: 'Where will your journey begin?',
    subtitle: 'We will tailor route logistics, travel times, and first-day plans from your departure city.',
    checkTitle: 'STARTING CITY',
    checklistHelper: 'Set your departure city',
    hint: 'e.g. New Delhi, Mumbai, Bengaluru',
  },
  {
    stepNumber: '03',
    title: 'Who is joining this journey?',
    subtitle: 'Tell us about your group so AI matches the activity pace, stays, and recommendations.',
    checkTitle: 'TRAVEL GROUP',
    checklistHelper: 'Choose group & travellers',
    hint: '',
  },
  {
    stepNumber: '04',
    title: 'When are you planning to go?',
    subtitle: 'Pick your travel window (up to 21 days). We will curate a day-by-day timetable.',
    checkTitle: 'TRAVEL DATES',
    checklistHelper: 'Set your dates',
    hint: '',
  },
  {
    stepNumber: '05',
    title: 'What vibe & budget fit your trip?',
    subtitle: 'Pick your travel mood and share any special wishes like street food or quiet stays.',
    checkTitle: 'VIBE & BUDGET',
    checklistHelper: 'Pick mood, notes & budget',
    hint: '',
  },
];

const styles = [
  { name: 'Easygoing', icon: '🧘', desc: 'Slow mornings & chai' },
  { name: 'Culture', icon: '🏛️', desc: 'Forts, crafts & history' },
  { name: 'Food & cafés', icon: '☕', desc: 'Street food & local eats' },
  { name: 'Nature', icon: '🌿', desc: 'Hills, lakes & trails' },
  { name: 'Adventure', icon: '🧗', desc: 'Hikes, outdoors & thrill' },
  { name: 'Spiritual', icon: '🪔', desc: 'Temples, ghats & aarti' },
  { name: 'Beaches', icon: '🏖️', desc: 'Coasts, sun & waves' },
];

const groupTypes = [
  { type: 'Solo', icon: '🎒', label: 'Solo', defaultTravelers: 1 },
  { type: 'Couple', icon: '👫', label: 'Couple', defaultTravelers: 2 },
  { type: 'Family', icon: '👨‍👩‍👧‍👦', label: 'Family', defaultTravelers: 4 },
  { type: 'Friends', icon: '👯‍♂️', label: 'Friends', defaultTravelers: 3 },
  { type: 'Group', icon: '👥', label: 'Group', defaultTravelers: 6 },
];

const popularDestinations = [
  { name: 'Jaipur', tag: 'Rajasthan' },
  { name: 'Kerala Backwaters', tag: 'South India' },
  { name: 'Varanasi', tag: 'Uttar Pradesh' },
  { name: 'Goa', tag: 'West Coast' },
  { name: 'Ladakh', tag: 'Himalayas' },
  { name: 'Udaipur', tag: 'Lakes & Palaces' },
  { name: 'Manali', tag: 'Himachal' },
  { name: 'Rishikesh', tag: 'Uttarakhand' },
];

const popularOrigins = [
  'Delhi NCR', 'Mumbai', 'Bengaluru', 'Kolkata', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad',
];

const quickBudgets = [
  { label: '₹15,000', value: 15000, desc: 'Budget' },
  { label: '₹35,000', value: 35000, desc: 'Moderate' },
  { label: '₹75,000', value: 75000, desc: 'Comfort' },
  { label: '₹1,50,000', value: 150000, desc: 'Luxury' },
];

const emptyAnswers = {
  destination: '',
  origin: '',
  group_type: '',
  travelers: 2,
  start_date: '',
  end_date: '',
  style: '',
  preferences: '',
  budget: '',
};

function validDateRange(start, end) {
  return Boolean(start && end && end >= start);
}

function calculateDays(start, end) {
  if (!start || !end || end < start) return 0;
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  const diffTime = Math.abs(e - s);
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function formatMoney(value) {
  if (!value) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDateShort(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(`${dateString}T00:00:00`);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return dateString;
  }
}

export default function AiTripWizard() {
  const [answers, setAnswers] = useState(emptyAnswers);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destination = params.get('destination')?.trim();
    const groupType = params.get('group_type');
    const style = params.get('style');
    const preferences = params.get('preferences')?.trim();
    const validGroupTypes = ['Solo', 'Couple', 'Family', 'Friends', 'Group'];
    const validStyles = styles.map((s) => s.name);

    if (
      destination ||
      validGroupTypes.includes(groupType) ||
      validStyles.includes(style) ||
      preferences
    ) {
      setAnswers((current) => ({
        ...current,
        ...(destination ? { destination } : {}),
        ...(validGroupTypes.includes(groupType) ? { group_type: groupType } : {}),
        ...(validStyles.includes(style) ? { style } : {}),
        ...(preferences ? { preferences } : {}),
      }));
    }
  }, []);

  // Cycle loading messages when generating
  useEffect(() => {
    if (!busy) {
      setLoadingPhase(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingPhase((p) => (p + 1) % 4);
    }, 2200);
    return () => clearInterval(interval);
  }, [busy]);

  const complete = useMemo(() => [
    Boolean(answers.destination.trim()),
    Boolean(answers.origin.trim()),
    Boolean(answers.group_type && Number(answers.travelers) >= 1 && Number(answers.travelers) <= 20),
    validDateRange(answers.start_date, answers.end_date),
    Boolean(answers.style),
  ], [answers]);

  const capturedCount = complete.filter(Boolean).length;
  const progressPercent = Math.round((capturedCount / 5) * 100);

  const tripDays = useMemo(() => {
    return calculateDays(answers.start_date, answers.end_date);
  }, [answers.start_date, answers.end_date]);

  const update = (name, value) => {
    setError('');
    setAnswers((current) => ({ ...current, [name]: value }));
  };

  const handleGroupSelect = (group) => {
    setError('');
    setAnswers((current) => ({
      ...current,
      group_type: group.type,
      travelers: current.travelers || group.defaultTravelers,
    }));
  };

  const adjustTravelers = (delta) => {
    setError('');
    setAnswers((current) => {
      const nextCount = Math.min(20, Math.max(1, Number(current.travelers || 1) + delta));
      return { ...current, travelers: nextCount };
    });
  };

  const setDurationDays = (days) => {
    setError('');
    const today = new Date().toISOString().slice(0, 10);
    const startDate = answers.start_date || today;
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(start);
    end.setDate(start.getDate() + (days - 1));
    const endDate = end.toISOString().slice(0, 10);
    setAnswers((current) => ({
      ...current,
      start_date: startDate,
      end_date: endDate,
    }));
  };

  const summaries = [
    complete[0] ? answers.destination : questions[0].checklistHelper,
    complete[1] ? answers.origin : questions[1].checklistHelper,
    complete[2]
      ? `${answers.group_type} · ${answers.travelers} ${Number(answers.travelers) === 1 ? 'person' : 'people'}`
      : questions[2].checklistHelper,
    complete[3]
      ? `${formatDateShort(answers.start_date)} → ${formatDateShort(answers.end_date)} (${tripDays}d)`
      : questions[3].checklistHelper,
    complete[4]
      ? `${answers.style}${answers.budget ? ` · ${formatMoney(answers.budget)}` : ''}`
      : questions[4].checklistHelper,
  ];

  function canContinue() {
    if (step === 0) return Boolean(answers.destination.trim());
    if (step === 1) return Boolean(answers.origin.trim());
    if (step === 2) {
      return Boolean(
        answers.group_type &&
        Number.isInteger(Number(answers.travelers)) &&
        Number(answers.travelers) >= 1 &&
        Number(answers.travelers) <= 20
      );
    }
    if (step === 3) return validDateRange(answers.start_date, answers.end_date);
    return Boolean(answers.style);
  }

  async function generate(event) {
    if (event) event.preventDefault();
    setError('');
    if (!complete.every(Boolean)) {
      setError('Please complete all 5 steps before generating your itinerary.');
      return;
    }
    setBusy(true);
    try {
      const response = await api.post('/ai/plan', answers);
      router.push(`/trips/${response.data.data.trip.id}`);
      router.refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not create your trip right now. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function next(event) {
    event.preventDefault();
    setError('');
    if (!canContinue()) {
      setError('Please complete this question to continue.');
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  }

  const loadingMessages = [
    'Analyzing regional routes & transport…',
    'Selecting hand-picked local sights & cultural stops…',
    'Structuring day-by-day timings & chai breaks…',
    'Finalizing your personalized Indian travel itinerary…',
  ];

  return (
    <div className="ai-wizard-container">
      {/* Top Banner / Studio Header */}
      <header className="ai-wizard-header">
        <div className="wizard-tag">
          <span className="wizard-tag-pulse" aria-hidden="true" />
          <span className="wizard-tag-text">AI TRIP PLANNER</span>
        </div>
        <h1 className="wizard-title">
          Where will India take you <em>next?</em>
        </h1>
        <p className="wizard-subtitle">
          5 quick questions. Our AI curates your custom day-by-day itinerary with verified timings, hidden stops, and rupee budget breakdowns.
        </p>

        {/* Horizontal Interactive Steps Bar */}
        <nav className="wizard-steps-nav" aria-label="Trip planning steps">
          <div className="wizard-steps-track">
            {questions.map((q, index) => {
              const isDone = complete[index];
              const isCurrent = step === index;
              return (
                <button
                  key={q.stepNumber}
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(index);
                  }}
                  className={`step-pill-btn ${isCurrent ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span className="step-pill-badge">
                    {isDone ? '✓' : q.stepNumber}
                  </span>
                  <span className="step-pill-label">{q.checkTitle}</span>
                </button>
              );
            })}
          </div>

          <div className="wizard-progress-bar-wrap">
            <div
              className="wizard-progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </nav>
      </header>

      {/* Main Split Layout: Studio Form on Left, Live Dossier on Right */}
      <div className="wizard-split-layout">
        {/* Left Column: Interactive Step Card */}
        <main className="wizard-card-column">
          <form
            className="wizard-step-card"
            onSubmit={step === 4 ? generate : next}
          >
            {/* Step Top Bar */}
            <div className="step-card-header">
              <div className="step-indicator">
                <span className="step-indicator-num">STEP {questions[step].stepNumber}</span>
                <span className="step-indicator-divider">/</span>
                <span className="step-indicator-total">05</span>
              </div>
              <span className="step-chip-name">{questions[step].checkTitle}</span>
            </div>

            <h2 className="step-question-title">{questions[step].title}</h2>
            <p className="step-question-desc">{questions[step].subtitle}</p>

            {/* Step 0: Destination */}
            {step === 0 && (
              <div className="step-input-body">
                <div className="input-group">
                  <label className="input-label" htmlFor="destination-input">
                    Target Destination
                  </label>
                  <div className="input-field-wrapper">
                    <span className="input-leading-icon" aria-hidden="true">📍</span>
                    <input
                      id="destination-input"
                      autoFocus
                      name="destination"
                      className="text-input"
                      value={answers.destination === 'Surprise me' ? '' : answers.destination}
                      onChange={(e) => update('destination', e.target.value)}
                      maxLength={120}
                      placeholder="Enter city, region, or state in India…"
                    />
                    {answers.destination && answers.destination !== 'Surprise me' && (
                      <button
                        type="button"
                        className="input-clear-btn"
                        onClick={() => update('destination', '')}
                        aria-label="Clear destination"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Surprise Me option */}
                <button
                  type="button"
                  className={`surprise-card-btn ${answers.destination === 'Surprise me' ? 'is-selected' : ''}`}
                  onClick={() =>
                    update('destination', answers.destination === 'Surprise me' ? '' : 'Surprise me')
                  }
                >
                  <div className="surprise-icon">✨</div>
                  <div className="surprise-copy">
                    <strong>Surprise me with a destination</strong>
                    <span>Let AI pick a hidden Indian paradise suited to your vibe</span>
                  </div>
                  <span className="surprise-badge">
                    {answers.destination === 'Surprise me' ? 'Selected ✓' : '✦ Suggest'}
                  </span>
                </button>

                {/* Popular Inspiration Chips */}
                <div className="popular-chips-section">
                  <span className="chips-title">Popular Destinations in India:</span>
                  <div className="chips-grid">
                    {popularDestinations.map((dest) => {
                      const isSelected = answers.destination === dest.name;
                      return (
                        <button
                          key={dest.name}
                          type="button"
                          className={`dest-chip ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => update('destination', dest.name)}
                        >
                          <span className="chip-name">{dest.name}</span>
                          <span className="chip-tag">{dest.tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <DestinationPhoto
                  destination={answers.destination === 'Surprise me' ? '' : answers.destination}
                  className="planner-destination-photo"
                  priority
                />
              </div>
            )}

            {/* Step 1: Starting City (Origin) */}
            {step === 1 && (
              <div className="step-input-body">
                <div className="input-group">
                  <label className="input-label" htmlFor="origin-input">
                    Starting City / Departure Point
                  </label>
                  <div className="input-field-wrapper">
                    <span className="input-leading-icon" aria-hidden="true">🛫</span>
                    <input
                      id="origin-input"
                      autoFocus
                      name="origin"
                      className="text-input"
                      value={answers.origin}
                      onChange={(e) => update('origin', e.target.value)}
                      maxLength={120}
                      placeholder="Your city (e.g. New Delhi, Mumbai, Bengaluru)"
                    />
                    {answers.origin && (
                      <button
                        type="button"
                        className="input-clear-btn"
                        onClick={() => update('origin', '')}
                        aria-label="Clear starting city"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Origin Quick Hubs */}
                <div className="popular-chips-section">
                  <span className="chips-title">Common Starting Hubs:</span>
                  <div className="chips-grid">
                    {popularOrigins.map((city) => {
                      const isSelected = answers.origin === city;
                      return (
                        <button
                          key={city}
                          type="button"
                          className={`simple-chip ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => update('origin', city)}
                        >
                          {city}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Who's Coming Along */}
            {step === 2 && (
              <div className="step-input-body">
                <div className="input-group">
                  <label className="input-label">Travel Group Dynamic</label>
                  <div className="group-cards-grid">
                    {groupTypes.map((g) => {
                      const isSelected = answers.group_type === g.type;
                      return (
                        <button
                          key={g.type}
                          type="button"
                          className={`group-type-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleGroupSelect(g)}
                        >
                          <span className="group-card-icon">{g.icon}</span>
                          <span className="group-card-label">{g.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Traveller count stepper */}
                <div className="input-group travelers-stepper-wrap">
                  <label className="input-label" htmlFor="travelers-input">
                    Total Travellers
                  </label>
                  <div className="stepper-row">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => adjustTravelers(-1)}
                      disabled={Number(answers.travelers) <= 1}
                      aria-label="Decrease travellers"
                    >
                      −
                    </button>
                    <div className="stepper-value-box">
                      <input
                        id="travelers-input"
                        type="number"
                        min="1"
                        max="20"
                        className="stepper-input"
                        value={answers.travelers}
                        onChange={(e) => update('travelers', e.target.value)}
                      />
                      <span className="stepper-unit">
                        {Number(answers.travelers) === 1 ? 'traveller' : 'travellers'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => adjustTravelers(1)}
                      disabled={Number(answers.travelers) >= 20}
                      aria-label="Increase travellers"
                    >
                      ＋
                    </button>
                  </div>
                  <span className="helper-hint">Supports up to 20 people per itinerary.</span>
                </div>
              </div>
            )}

            {/* Step 3: Dates */}
            {step === 3 && (
              <div className="step-input-body">
                <div className="date-fields-grid">
                  <div className="input-group">
                    <label className="input-label" htmlFor="start-date-input">
                      Departure Date
                    </label>
                    <div className="input-field-wrapper">
                      <span className="input-leading-icon" aria-hidden="true">📅</span>
                      <input
                        id="start-date-input"
                        autoFocus
                        type="date"
                        className="text-input"
                        min={new Date().toISOString().slice(0, 10)}
                        value={answers.start_date}
                        onChange={(e) => update('start_date', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="end-date-input">
                      Return Date
                    </label>
                    <div className="input-field-wrapper">
                      <span className="input-leading-icon" aria-hidden="true">🏁</span>
                      <input
                        id="end-date-input"
                        type="date"
                        className="text-input"
                        min={answers.start_date || new Date().toISOString().slice(0, 10)}
                        value={answers.end_date}
                        onChange={(e) => update('end_date', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Duration badge or quick presets */}
                {tripDays > 0 ? (
                  <div className="duration-highlight-card">
                    <span className="duration-icon">⏳</span>
                    <div>
                      <strong>{tripDays} Days & {Math.max(1, tripDays - 1)} Nights Plan</strong>
                      <span>
                        From {formatDateShort(answers.start_date)} to {formatDateShort(answers.end_date)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="duration-helper-text">
                    Choose dates between 1 and 21 days for the AI to schedule each day.
                  </div>
                )}

                {/* Quick duration presets */}
                <div className="popular-chips-section">
                  <span className="chips-title">Quick Duration Presets:</span>
                  <div className="chips-grid">
                    {[
                      { label: '3 Days (Weekend)', days: 3 },
                      { label: '5 Days (Getaway)', days: 5 },
                      { label: '7 Days (1 Week)', days: 7 },
                      { label: '10 Days (Extended)', days: 10 },
                    ].map((item) => (
                      <button
                        key={item.days}
                        type="button"
                        className={`simple-chip ${tripDays === item.days ? 'is-selected' : ''}`}
                        onClick={() => setDurationDays(item.days)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Vibe & Budget */}
            {step === 4 && (
              <div className="step-input-body">
                {/* Travel Mood */}
                <div className="input-group">
                  <label className="input-label">Travel Mood & Style</label>
                  <div className="styles-cards-grid">
                    {styles.map((styleObj) => {
                      const isSelected = answers.style === styleObj.name;
                      return (
                        <button
                          key={styleObj.name}
                          type="button"
                          className={`style-card-btn ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => update('style', styleObj.name)}
                        >
                          <span className="style-card-icon">{styleObj.icon}</span>
                          <div className="style-card-info">
                            <strong>{styleObj.name}</strong>
                            <span>{styleObj.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Budget input with quick presets */}
                <div className="input-group">
                  <label className="input-label" htmlFor="budget-input">
                    Total Estimated Budget <span className="label-subtext">(INR ₹ · Optional)</span>
                  </label>
                  <div className="input-field-wrapper">
                    <span className="input-leading-icon" aria-hidden="true">₹</span>
                    <input
                      id="budget-input"
                      type="number"
                      min="0"
                      max="999999999"
                      step="1000"
                      className="text-input"
                      value={answers.budget}
                      onChange={(e) => update('budget', e.target.value)}
                      placeholder="e.g. 45000 (leave blank for AI recommendation)"
                    />
                  </div>

                  <div className="budget-presets-row">
                    {quickBudgets.map((b) => (
                      <button
                        key={b.value}
                        type="button"
                        className={`budget-chip ${Number(answers.budget) === b.value ? 'is-selected' : ''}`}
                        onClick={() => update('budget', b.value)}
                      >
                        <strong>{b.label}</strong>
                        <span>{b.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferences textarea */}
                <div className="input-group">
                  <label className="input-label" htmlFor="preferences-input">
                    Special Requests & Preferences <span className="label-subtext">(Optional)</span>
                  </label>
                  <textarea
                    id="preferences-input"
                    className="textarea-input"
                    value={answers.preferences}
                    onChange={(e) => update('preferences', e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="e.g. Authentic vegetarian street food, photography vantage points, slow pace with senior travellers, scenic trains…"
                  />
                  <span className="helper-hint">
                    {1000 - (answers.preferences?.length || 0)} characters remaining
                  </span>
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="wizard-error-banner" role="alert">
                <span className="error-icon" aria-hidden="true">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Step Actions Footer */}
            <div className="step-actions-footer">
              <button
                type="button"
                className="step-back-btn"
                onClick={() => {
                  setError('');
                  setStep((c) => Math.max(0, c - 1));
                }}
                disabled={step === 0 || busy}
              >
                ← Back
              </button>

              {step < 4 ? (
                <button
                  type="submit"
                  className="step-continue-btn"
                  disabled={!canContinue() || busy}
                >
                  Continue to Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  className="step-generate-btn"
                  disabled={!complete.every(Boolean) || busy}
                >
                  {busy ? (
                    <span className="btn-loading-state">
                      <span className="btn-spinner" aria-hidden="true" />
                      Creating Itinerary…
                    </span>
                  ) : (
                    <span>Generate My Trip Itinerary ✨</span>
                  )}
                </button>
              )}
            </div>
          </form>
        </main>

        {/* Right Column: Live Trip Dossier / Blueprint Passport */}
        <aside className="wizard-dossier-column" aria-label="Trip Blueprint">
          <div className="dossier-card">
            {/* Dossier Header */}
            <div className="dossier-header">
              <div className="dossier-badge">
                <span className="sparkle-icon">✦</span> LIVE BLUEPRINT
              </div>
              <h2 className="dossier-title">Your Journey Dossier</h2>
              <p className="dossier-subtitle">
                Updates in real-time as you shape your trip.
              </p>
            </div>

            {/* Travel Route Visualizer */}
            <div className="route-visualizer-card">
              <div className="route-point">
                <span className="point-tag">DEPARTURE</span>
                <strong className="point-name">
                  {answers.origin.trim() || 'Starting City'}
                </strong>
              </div>
              <div className="route-connector" aria-hidden="true">
                <span className="route-line" />
                <span className="route-plane">✈</span>
                <span className="route-line" />
              </div>
              <div className="route-point">
                <span className="point-tag">DESTINATION</span>
                <strong className="point-name">
                  {answers.destination.trim() || 'Where to?'}
                </strong>
              </div>
            </div>

            {/* Summary Grid Specs */}
            <div className="dossier-specs-grid">
              <div className="spec-item">
                <span className="spec-label">Group</span>
                <strong className="spec-val">
                  {answers.group_type
                    ? `${answers.group_type} · ${answers.travelers}p`
                    : 'Not set yet'}
                </strong>
              </div>
              <div className="spec-item">
                <span className="spec-label">Duration</span>
                <strong className="spec-val">
                  {tripDays > 0 ? `${tripDays} Days` : 'Dates pending'}
                </strong>
              </div>
              <div className="spec-item">
                <span className="spec-label">Travel Vibe</span>
                <strong className="spec-val">
                  {answers.style || 'Choose vibe'}
                </strong>
              </div>
              <div className="spec-item">
                <span className="spec-label">Budget</span>
                <strong className="spec-val">
                  {answers.budget ? formatMoney(answers.budget) : 'AI Estimated'}
                </strong>
              </div>
            </div>

            {/* 5-Step Interactive Checklist */}
            <div className="dossier-checklist-section">
              <div className="checklist-heading-row">
                <span className="checklist-header-title">Readiness Checklist</span>
                <span className="checklist-score">
                  <strong>{capturedCount}</strong> of 5 Ready
                </span>
              </div>

              <div className="checklist-items-stack">
                {questions.map((q, index) => {
                  const isDone = complete[index];
                  const isCurrent = step === index;
                  return (
                    <button
                      key={q.stepNumber}
                      type="button"
                      className={`checklist-item-row ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                      onClick={() => {
                        setError('');
                        setStep(index);
                      }}
                    >
                      <span className="checklist-check-circle">
                        {isDone ? '✓' : q.stepNumber}
                      </span>
                      <div className="checklist-item-texts">
                        <strong className="checklist-item-name">{q.checkTitle}</strong>
                        <span className="checklist-item-value">{summaries[index]}</span>
                      </div>
                      <span className="checklist-item-arrow" aria-hidden="true">›</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button in Dossier */}
            <div className="dossier-generate-footer">
              {step !== 4 && (
                <button
                  type="button"
                  className="dossier-action-btn"
                  disabled={!complete.every(Boolean) || busy}
                  onClick={generate}
                >
                  {busy ? (
                    <span className="btn-loading-state">
                      <span className="btn-spinner" aria-hidden="true" />
                      AI is building your itinerary…
                    </span>
                  ) : (
                    <span>Generate Itinerary with AI ✦</span>
                  )}
                </button>
              )}

              {busy ? (
                <div className="ai-loading-status-ticker" role="status">
                  <span className="ticker-pulse" />
                  <p className="ticker-message">{loadingMessages[loadingPhase]}</p>
                </div>
              ) : (
                <p className="dossier-guarantee-note">
                  ✨ TripPlanner AI builds tailored day-wise routes, local cuisine spots, and realistic transit timings.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
