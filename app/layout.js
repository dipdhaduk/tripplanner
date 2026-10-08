import './globals.css';
import Navbar from '@/components/layout/Navbar';
import SiteFooter from '@/components/layout/SiteFooter';
export const metadata={title:'TripPlanner — Itinerary Planner',description:'Plan India journeys, manage budgets in rupees, and keep every day in one place.'};
export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth">
      <body><Navbar /><main>{children}</main><SiteFooter /></body>
    </html>
  );
}
