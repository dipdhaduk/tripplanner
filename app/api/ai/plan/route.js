import { requireUser } from '@/lib/auth';
import { getDb, nextId, now } from '@/lib/db';
import { bodyOf, fail, ok, serverError, validDate } from '@/lib/http';

const stringField = { type: 'string' };
const activitySchema = {
  type: 'object',
  required: ['day_number', 'activity', 'location', 'activity_date', 'start_time', 'end_time', 'notes'],
  properties: {
    day_number: { type: 'integer' }, activity: stringField, location: stringField,
    activity_date: stringField, start_time: stringField, end_time: stringField, notes: stringField,
  },
};
const legSchema = {
  type: 'object',
  required: ['destination', 'start_date', 'end_date', 'summary', 'arrival', 'transfer', 'stay', 'estimated_budget_inr', 'itinerary'],
  properties: {
    destination: stringField, start_date: stringField, end_date: stringField, summary: stringField,
    arrival: stringField, transfer: stringField, stay: stringField,
    estimated_budget_inr: { type: 'integer' },
    itinerary: { type: 'array', items: activitySchema },
  },
};
const planSchema = {
  type: 'object',
  required: ['trip_name', 'estimated_budget', 'summary', 'legs'],
  properties: {
    trip_name: stringField, estimated_budget: { type: 'integer' }, summary: stringField,
    legs: { type: 'array', items: legSchema },
  },
};

function validateAnswers(body) {
  const destination = typeof body?.destination === 'string' ? body.destination.trim() : '';
  const origin = typeof body?.origin === 'string' ? body.origin.trim() : '';
  const groupType = typeof body?.group_type === 'string' ? body.group_type.trim() : '';
  const travelers = Number(body?.travelers);
  const startDate = body?.start_date;
  const endDate = body?.end_date;
  const style = typeof body?.style === 'string' ? body.style.trim() : '';
  const preferences = typeof body?.preferences === 'string' ? body.preferences.trim() : '';
  const budget = body?.budget === '' || body?.budget == null ? null : Number(body.budget);
  if (!destination || destination.length > 120) return 'Choose a destination or select “Surprise me”.';
  if (!origin || origin.length > 120) return 'Add your starting city.';
  if (!['Solo', 'Couple', 'Family', 'Friends', 'Group'].includes(groupType)) return 'Choose who is travelling.';
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 20) return 'Choose between 1 and 20 travellers.';
  if (!validDate(startDate) || !validDate(endDate) || endDate < startDate) return 'Choose valid travel dates.';
  const days = Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000) + 1;
  if (days < 1 || days > 21) return 'Choose a trip between 1 and 21 days.';
  if (!style || style.length > 80) return 'Choose the kind of trip you want.';
  if (preferences.length > 1000) return 'Keep your trip notes under 1,000 characters.';
  if (budget !== null && (!Number.isFinite(budget) || budget < 0 || budget > 999999999)) return 'Enter a valid rupee budget.';
  return { destination, origin, groupType, travelers, startDate, endDate, days, style, preferences, budget };
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function addDays(date, count) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function daysBetween(start, end) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
}

function splitDateRange(start, totalDays, legCount) {
  const baseDays = Math.floor(totalDays / legCount);
  const extraDays = totalDays % legCount;
  let offset = 0;
  return Array.from({ length: legCount }, (_, index) => {
    const length = baseDays + (index < extraDays ? 1 : 0);
    const range = { start_date: addDays(start, offset), end_date: addDays(start, offset + length - 1) };
    offset += length;
    return range;
  });
}

function safeEstimate(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, Math.min(999999999, Math.round(amount))) : 0;
}

export async function POST(request) {
  try {
    const auth = await requireUser();
    if (auth.error) return fail(auth.error, auth.status);
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey?.trim()) {
      console.error('AI itinerary generation is disabled: no Gemini API key is configured.');
      return fail('The AI planner is not connected yet. Add your Gemini API key to .env.local and restart the app.', 503);
    }

    const answers = validateAnswers(await bodyOf(request));
    if (typeof answers === 'string') return fail(answers);

    const isInspiration = answers.destination.toLowerCase() === 'surprise me';
    const prompt = {
      destination_anchor: isInspiration ? null : answers.destination,
      origin: answers.origin,
      travelers: answers.travelers,
      group_type: answers.groupType,
      start_date: answers.startDate,
      end_date: answers.endDate,
      days: answers.days,
      style: answers.style,
      preferences: answers.preferences,
      budget_limit_inr: answers.budget,
    };
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const instructions = [
      'You are TripPlanner, an India-first multi-city itinerary planner. Create a practical route of 2 to 4 destinations when the trip length allows, with sensible travel time and pacing.',
      'For a named destination, make it the first stop and add nearby or well-connected destinations that fit the dates and budget. If destination_anchor is null, choose a coherent route in India.',
      'Divide the exact requested date range into contiguous destination legs. The first leg starts on start_date, the last ends on end_date, and no date is skipped or repeated.',
      'Return one or two useful activities for every trip day. day_number is global across the trip, starts at 1, and activity_date must match its leg and day.',
      'For each leg, give a short summary, a suggested arrival mode/route, a local transfer idea, a suggested area and type of stay, and an approximate INR budget.',
      'These are AI suggestions only. Never invent bookable hotel names, flight numbers, exact schedules, live weather, availability, reviews, or confirmed prices. Clearly say estimates must be checked before booking.',
      'Keep transport practical, include local food and realistic downtime, and respect the group, travel style, preferences, and budget limit when provided.',
      'Use 24-hour HH:MM local times and YYYY-MM-DD dates. Keep each description concise. The total budget is an approximate Indian rupee estimate, not a quote.',
    ].join(' ');
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey.trim(), 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(prompt) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            ...planSchema,
            properties: {
              ...planSchema.properties,
              legs: {
                ...planSchema.properties.legs,
                minItems: answers.days > 1 ? 2 : 1,
                maxItems: Math.min(4, answers.days),
              },
            },
          },
          maxOutputTokens: 10000,
        },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return fail('Gemini free-tier limit reached. Wait a little and try again.', 429);
      if (aiResponse.status === 400 || aiResponse.status === 401 || aiResponse.status === 403) {
        const upstreamError = await aiResponse.json().catch(() => null);
        console.error('Gemini rejected the itinerary request:', aiResponse.status, upstreamError?.error?.message || 'No error details returned.');
        return fail('Gemini rejected the itinerary request. Check the API key, model access, and API quota in Google AI Studio.', 503);
      }
      const upstreamError = await aiResponse.json().catch(() => null);
      console.error('Gemini itinerary request failed:', aiResponse.status, upstreamError?.error?.message || 'No error details returned.');
      return fail('The AI could not create this trip right now. Please try again.', 502);
    }

    const payload = await aiResponse.json();
    const generatedText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    const finishReason = payload.candidates?.[0]?.finishReason;
    if (finishReason === 'MAX_TOKENS') return fail('The itinerary was too large to finish. Try a shorter trip or fewer travel preferences.', 502);
    if (!generatedText) {
      console.error('Gemini returned no itinerary text. Finish reason:', finishReason || payload.promptFeedback?.blockReason || 'unknown');
      return fail('Gemini could not complete the itinerary. Please adjust your trip details and try again.', 502);
    }
    let plan;
    try { plan = JSON.parse(generatedText); } catch { return fail('The AI returned an incomplete plan. Please try again.', 502); }

    const tripName = cleanText(plan.trip_name, 120) || 'Your multi-city trip';
    const summary = cleanText(plan.summary, 4000) || 'A multi-city route planned around your dates, travel style, and budget. Check local routes and prices before booking.';
    const rawLegs = Array.isArray(plan.legs) ? plan.legs : [];
    const minLegs = answers.days > 1 ? 2 : 1;
    if (!tripName || !summary || rawLegs.length < minLegs || rawLegs.length > Math.min(4, answers.days)) {
      return fail('The AI returned an incomplete multi-city plan. Please try again.', 502);
    }

    const generatedRanges = rawLegs.map((leg) => ({ start_date: cleanText(leg.start_date, 10), end_date: cleanText(leg.end_date, 10) }));
    const hasContiguousRanges = generatedRanges.every((range, index) =>
      validDate(range.start_date) && validDate(range.end_date) && range.end_date >= range.start_date &&
      range.start_date === (index === 0 ? answers.startDate : addDays(generatedRanges[index - 1].end_date, 1))
    ) && generatedRanges[generatedRanges.length - 1].end_date === answers.endDate;
    const legRanges = hasContiguousRanges ? generatedRanges : splitDateRange(answers.startDate, answers.days, rawLegs.length);
    const legs = [];
    const itinerary = [];
    let expectedActivityDay = 1;
    for (let index = 0; index < rawLegs.length; index += 1) {
      const source = rawLegs[index];
      const range = legRanges[index];
      const leg = {
        leg_number: index + 1,
        destination: cleanText(source.destination, 120),
        start_date: range.start_date,
        end_date: range.end_date,
        summary: cleanText(source.summary, 1200) || `Explore ${cleanText(source.destination, 120)} at a relaxed pace.`,
        arrival: cleanText(source.arrival, 500) || `Plan a practical arrival into ${cleanText(source.destination, 120)} and confirm the route before departure.`,
        transfer: cleanText(source.transfer, 500) || `Use local taxis or public transport in ${cleanText(source.destination, 120)}; confirm current options on arrival.`,
        stay: cleanText(source.stay, 500) || `Choose a well-connected stay near the main sights in ${cleanText(source.destination, 120)}.`,
        estimated_budget_inr: safeEstimate(source.estimated_budget_inr),
      };
      if (!leg.destination) {
        return fail('The AI returned destination dates or travel details that do not fit the trip. Please try again.', 502);
      }
      const legActivities = Array.isArray(source.itinerary) ? source.itinerary : [];
      const legDayCount = daysBetween(leg.start_date, leg.end_date);
      const firstLegDay = expectedActivityDay;
      const lastLegDay = firstLegDay + legDayCount - 1;
      const activitiesOnDay = new Map();
      for (let itemIndex = 0; itemIndex < legActivities.length; itemIndex += 1) {
        const item = legActivities[itemIndex];
        const itemDate = cleanText(item.activity_date, 10);
        const modelDay = Number(item.day_number);
        let dayNumber;
        if (validDate(itemDate) && itemDate >= leg.start_date && itemDate <= leg.end_date) {
          dayNumber = daysBetween(answers.startDate, itemDate);
        } else if (Number.isInteger(modelDay) && modelDay >= firstLegDay && modelDay <= lastLegDay) {
          dayNumber = modelDay;
        } else if (Number.isInteger(modelDay) && modelDay >= 1 && modelDay <= legDayCount) {
          dayNumber = firstLegDay + modelDay - 1;
        } else {
          dayNumber = firstLegDay + (itemIndex % legDayCount);
        }
        if (!cleanText(item.activity, 200) || (activitiesOnDay.get(dayNumber) || 0) >= 2) continue;
        const timeCount = activitiesOnDay.get(dayNumber) || 0;
        const startTime = /^\d{2}:\d{2}$/.test(cleanText(item.start_time, 5)) ? cleanText(item.start_time, 5) : (timeCount === 0 ? '10:00' : '14:00');
        const endTime = /^\d{2}:\d{2}$/.test(cleanText(item.end_time, 5)) ? cleanText(item.end_time, 5) : (timeCount === 0 ? '12:00' : '16:00');
        const activity = {
          leg_number: index + 1,
          destination: leg.destination,
          day_number: dayNumber,
          activity: cleanText(item.activity, 200),
          location: cleanText(item.location, 200),
          activity_date: addDays(answers.startDate, dayNumber - 1),
          start_time: startTime,
          end_time: endTime,
          notes: cleanText(item.notes, 2000),
        };
        itinerary.push(activity);
        activitiesOnDay.set(dayNumber, timeCount + 1);
      }
      for (let dayNumber = firstLegDay; dayNumber <= lastLegDay; dayNumber += 1) {
        if (activitiesOnDay.has(dayNumber)) continue;
        itinerary.push({
          leg_number: index + 1, destination: leg.destination, day_number: dayNumber,
          activity: `Flexible time to explore ${leg.destination}`, location: leg.destination,
          activity_date: addDays(answers.startDate, dayNumber - 1), start_time: '10:00', end_time: '12:00',
          notes: 'A relaxed placeholder for local exploration. Confirm opening hours and travel times before you go.',
        });
      }
      expectedActivityDay = lastLegDay + 1;
      legs.push(leg);
    }
    if (legs[legs.length - 1].end_date !== answers.endDate || expectedActivityDay !== answers.days + 1) return fail('Could not divide the requested trip dates into destination stops.', 400);
    const daysWithActivities = new Set(itinerary.map((item) => item.day_number));
    if (daysWithActivities.size !== answers.days) return fail('The AI missed one or more trip days. Please try again.', 502);
    const activitiesPerDay = itinerary.reduce((counts, item) => counts.set(item.day_number, (counts.get(item.day_number) || 0) + 1), new Map());
    if ([...activitiesPerDay.values()].some((count) => count > 2)) return fail('The AI returned too many activities for a day. Please try again.', 502);

    const estimate = Number(plan.estimated_budget);
    const savedBudget = answers.budget ?? safeEstimate(estimate);
    const destination = legs.map((leg) => leg.destination).join(' → ').slice(0, 160);
    const timestamp = now();
    const trip = {
      id: await nextId('trips'), user_id: auth.user.id, trip_name: tripName, destination,
      start_date: answers.startDate, end_date: answers.endDate, budget: savedBudget,
      budget_source: answers.budget === null ? 'ai-estimate' : 'user-budget',
      summary,
      legs,
      notes: [`From ${answers.origin}.`, `${answers.groupType} trip for ${answers.travelers}.`, `Travel style: ${answers.style}.`, answers.preferences].filter(Boolean).join(' ').slice(0, 5000),
      created_at: timestamp, updated_at: timestamp,
    };
    const db = await getDb();
    await db.collection('trips').insertOne(trip);
    try {
      const documents = [];
      for (const item of itinerary) documents.push({ id: await nextId('itineraries'), trip_id: trip.id, ...item, created_at: timestamp });
      await db.collection('itineraries').insertMany(documents);
    } catch (error) {
      await db.collection('itineraries').deleteMany({ trip_id: trip.id });
      await db.collection('trips').deleteOne({ id: trip.id, user_id: auth.user.id });
      throw error;
    }
    return ok({ trip, itinerary }, 'Your multi-city AI itinerary is ready.', 201);
  } catch (error) {
    if (error?.name === 'TimeoutError') return fail('Trip generation took too long. Please try again.', 504);
    return serverError(error);
  }
}
