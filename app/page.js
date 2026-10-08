import Link from 'next/link';
import './home.css';

const tripStyles = [
  { number: '01', title: 'Family holidays', description: 'Balance big sights with slower mornings, meal breaks, and time for everyone.' },
  { number: '02', title: 'Couples getaways', description: 'Keep the special stops close at hand and leave room for an unplanned evening.' },
  { number: '03', title: 'Road trips', description: 'Keep destinations, daily stops, dates, and your trip budget together.' },
  { number: '04', title: 'Multi-city journeys', description: 'Organize each leg in one place, from the first departure to the last chai.' },
];

const destinations = [
  { name: 'Jaipur', region: 'Rajasthan', detail: 'Pink palaces, old bazaars & local food', image: 'https://images.unsplash.com/photo-1578999935853-4ec5fa6c1f60?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Kerala', region: 'South India', detail: 'Backwaters, houseboats & green hills', image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Varanasi', region: 'Uttar Pradesh', detail: 'Ganga ghats, temples & evening aarti', image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Ladakh', region: 'Himalayas', detail: 'High mountain passes & Pangong Lake', image: 'https://images.unsplash.com/photo-1584542017899-d8aa29272a27?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Goa', region: 'West India', detail: 'Palm-lined beaches & Portuguese lanes', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Agra', region: 'Uttar Pradesh', detail: 'Taj Mahal, Mughal history & gardens', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1000&q=80' },
];

const faqs = [
  { question: 'What can I add to a trip?', answer: 'Save a trip name, destination, dates, budget in rupees, and notes. Add activities by day with locations, times, and extra details.' },
  { question: 'Can I change my itinerary later?', answer: 'Yes. Edit or remove trips and activities as your plans change. Your itinerary stays organized by day.' },
  { question: 'Can I plan more than one trip?', answer: 'Yes. Your dashboard keeps your trips together, so you can plan upcoming journeys and revisit past ones.' },
];

export default function Home() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> THOUGHTFULLY PLANNED, DEEPLY FELT</span>
          <h1>India, at your pace.<br /><em>One stop at a time.</em></h1>
          <p>From chai stops to mountain views, bring every destination, daily plan, and rupee budget together in one calm space.</p>
          <div className="hero-actions">
            <Link href="/register" className="button button-primary">Plan your next trip <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="hero-note"><span aria-hidden="true">✳</span> Less juggling. More journey.</div>
        </div>
        <div className="hero-art" aria-label="Illustration of a sunset over green hills">
          <div className="sun-orb" /><div className="landscape ridge-back" /><div className="landscape ridge-front" />
          <div className="art-card glass"><span className="art-label">A LITTLE INSPIRATION <span className="hindi-label">सफ़र</span></span><h3>Rajasthan, at a gentle pace</h3><p>4 days · room for chai</p><div className="art-progress"><i /></div><span className="art-bottom">The best stories take the scenic route <span>↗</span></span></div>
          <span className="art-coordinate">26° 55&apos; N<br />75° 49&apos; E</span>
        </div>
      </section>

      <section className="feature-strip" aria-label="TripPlanner features">
        <div><span className="feature-icon">01</span><h3>Every trip, one place</h3><p>Keep destinations, dates, notes, and rupee budgets together.</p></div>
        <div><span className="feature-icon">02</span><h3>Days with room to wander</h3><p>Plan activities by day, with time for the unexpected.</p></div>
        <div><span className="feature-icon">03</span><h3>Easy to adjust</h3><p>Edit your plans whenever the journey takes a new turn.</p></div>
      </section>

      <section className="home-section destinations-section" id="destinations">
        <div className="home-section-heading"><span className="eyebrow">INDIA, WIDE OPEN</span><h2>Find your next trip.</h2><p>From Himalayan lakes to quiet backwaters, start with a place that feels like you.</p></div>
        <div className="home-destinations-grid">
          {destinations.map((destination) => <Link className="home-destination-card" key={destination.name} href={`/trips/new?destination=${encodeURIComponent(destination.name)}`} aria-label={`Plan a trip to ${destination.name}`}>
            <span className="home-destination-photo" role="img" aria-label={`${destination.name}, India`} style={{ backgroundImage: `linear-gradient(180deg,rgba(35,40,31,.02),rgba(35,40,31,.1)),url("${destination.image}")` }} />
            <span className="home-destination-copy"><span>{destination.region}</span><strong>{destination.name}</strong><small>{destination.detail}</small></span>
            <span className="home-destination-arrow" aria-hidden="true">↗</span>
          </Link>)}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading"><span className="eyebrow">MADE FOR YOUR KIND OF JOURNEY</span><h2>Big family holiday or a little weekend away.</h2><p>Start with the trip you have in mind. Add the details as they come together.</p></div>
        <div className="trip-style-grid">
          {tripStyles.map((style) => <article className="trip-style-card" key={style.number}><span>{style.number}</span><h3>{style.title}</h3><p>{style.description}</p></article>)}
        </div>
      </section>

      <section className="home-planning glass">
        <div><span className="eyebrow">FROM IDEA TO ITINERARY</span><h2>A plan that can change with you.</h2><p>Add your destination and dates, then build a day-by-day itinerary with activities, places, times, notes, and a budget. Keep it flexible as your plans take shape.</p></div>
        <Link className="text-link home-reviews-link" href="/reviews">Read traveller reviews <span aria-hidden="true">→</span></Link>
      </section>

      <section className="home-section home-faq">
        <div className="home-section-heading"><span className="eyebrow">A FEW QUICK ANSWERS</span><h2>Planning, made simple.</h2></div>
        <div className="faq-list">{faqs.map((faq) => <details className="faq-item" key={faq.question}><summary>{faq.question}<span aria-hidden="true">＋</span></summary><p>{faq.answer}</p></details>)}</div>
      </section>

      <section className="home-cta"><div><span className="eyebrow">YOUR NEXT JOURNEY STARTS HERE</span><h2>Make room for the good bits.</h2><p>Bring your trip ideas together and take the first step.</p></div><Link className="button button-primary" href="/register">Create your trip <span aria-hidden="true">↗</span></Link></section>
    </div>
  );
}
