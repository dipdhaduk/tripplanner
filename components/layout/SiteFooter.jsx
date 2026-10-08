import Link from 'next/link';

const countries = ['Spain', 'Italy', 'Portugal', 'Indonesia', 'Germany', 'Russia', 'Australia'];

export default function SiteFooter() {
  return (
    <footer className="site-footer global-footer">
      <div className="footer-main">
        <div className="footer-about">
          <Link href="/" className="footer-brand"><span className="brand-mark">TP</span><span>TripPlanner<small>ITINERARY PLANNER</small></span></Link>
          <p>Thoughtful trip plans, day-by-day itineraries, and budgets in rupees—all in one place.</p>
        </div>
        <nav className="footer-column" aria-label="Company">
          <h2>Company</h2>
          <Link href="/">Home</Link>
          <Link href="/about">About us</Link>
          <Link href="/reviews">Reviews</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <nav className="footer-column" aria-label="Product">
          <h2>Product</h2>
          <Link href="/trips/new">AI trip planner</Link>
          <Link href="/dashboard">My trips</Link>
          <Link href="/register">Create an account</Link>
        </nav>
        <nav className="footer-column footer-countries" aria-label="Plan by country">
          <h2>Top countries</h2>
          <div className="footer-country-list">{countries.map((country) => <Link key={country} href={`/trips/new?destination=${encodeURIComponent(country)}`}>{country}</Link>)}</div>
        </nav>
        <nav className="footer-column" aria-label="Trip planning">
          <h2>Plan</h2>
          <Link href="/trips/new?group_type=Couple">Couple trip planner</Link>
          <Link href="/trips/new?group_type=Family">Family trip planner</Link>
          <Link href="/trips/new">Start planning</Link>
        </nav>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} TripPlanner</span><span>Made for journeys big and small · Budgets in ₹ INR</span></div>
    </footer>
  );
}
