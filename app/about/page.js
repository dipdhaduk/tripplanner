import Link from 'next/link';

const pillars = [
  { number: '01', label: 'START WITH THE IDEA', title: 'Five clear prompts', description: 'Choose where you want to go, where you are starting from, who is coming, when you will travel, and the kind of trip you want.' },
  { number: '02', label: 'SHAPE EACH DAY', title: 'A practical itinerary', description: 'Keep activities, places, dates, and times together so each day is easier to review and adjust.' },
  { number: '03', label: 'KEEP COSTS IN VIEW', title: 'Budgets in rupees', description: 'Set a trip budget in INR and keep it beside the dates and itinerary while your plans take shape.' },
];

export default function About() {
  return (
    <div className="page-shell info-page about-page">
      <section className="about-hero info-hero glass">
        <div className="about-hero-copy">
          <span className="eyebrow">TRIPPLANNER · MADE FOR THE JOURNEY</span>
          <h1>Less time juggling plans. More time looking forward to the trip.</h1>
          <p>TripPlanner brings your destination, dates, day plans, and rupee budget together, so the details feel lighter and the journey stays yours.</p>
          <div className="about-hero-actions">
            <Link className="button button-primary" href="/trips/new">Plan your trip</Link>
            <Link className="text-link" href="/contact">Talk to us <span aria-hidden="true">→</span></Link>
          </div>
          <div className="about-proofline"><span>AI assisted planning</span><i /> <span>INR budgets</span><i /> <span>Day by day</span></div>
        </div>
        <aside className="about-route-card" aria-label="Example trip plan from Jaipur to Udaipur">
          <div className="about-route-top"><span>YOUR NEXT JOURNEY</span><small>INDIA / YOUR PACE</small></div>
          <div className="about-route-heading"><strong>A little Rajasthan loop</strong><span>4 days</span></div>
          <div className="about-route-path"><span /><i /><span /><i /><span /></div>
          <div className="about-route-places"><div><small>01</small><strong>Jaipur</strong></div><div><small>02</small><strong>Jodhpur</strong></div><div><small>03</small><strong>Udaipur</strong></div></div>
          <div className="about-route-bottom"><span>Trip budget</span><strong>INR ₹ 24,000</strong></div>
        </aside>
      </section>

      <section className="about-story-grid">
        <div className="about-story">
          <span className="eyebrow">THE IDEA</span>
          <h2>Plans should support the journey, not take it over.</h2>
          <p>Trips often start with a place and a dozen scattered notes. TripPlanner gives those ideas one home: a simple itinerary you can revisit, update, and make your own.</p>
          <p>From a weekend by the coast to a longer journey across India, keep the useful details close and leave room for chai stops and unexpected turns.</p>
        </div>
        <div className="about-note glass">
          <span className="about-note-mark" aria-hidden="true">TP</span>
          <div><strong>Made for real travel details</strong><p>Dates, destinations, activities, notes, and your budget stay together in one place.</p></div>
        </div>
      </section>

      <section className="section-block about-pillars">
        <div className="section-heading"><div><span className="eyebrow">A SIMPLE WAY TO PLAN</span><h2>From first thought to day-by-day plan.</h2></div></div>
        <div className="about-pillar-grid">{pillars.map((pillar) => <article className="about-pillar glass" key={pillar.number}><span className="about-pillar-number">{pillar.number}</span><span className="eyebrow">{pillar.label}</span><h3>{pillar.title}</h3><p>{pillar.description}</p></article>)}</div>
      </section>

      <section className="about-cta"><div><span className="eyebrow">YOUR NEXT STORY IS OUT THERE</span><h2>Pick a place. Make a plan that feels like yours.</h2><p>Start with the destination. The rest can come together one step at a time.</p></div><Link className="button button-primary" href="/trips/new">Start planning <span aria-hidden="true">→</span></Link></section>
    </div>
  );
}
