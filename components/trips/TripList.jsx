import TripCard from './TripCard';
import Loader from '@/components/ui/Loader';
import EmptyState from '@/components/ui/EmptyState';
export default function TripList({trips,loading,error,onRetry,onDelete}){if(loading)return <Loader label="Loading your trips..."/>;if(error)return <div className="error-box"><span>{error}</span><button className="button button-quiet" onClick={onRetry}>Try again</button></div>;if(!trips?.length)return <EmptyState title="No trips yet" description="Start planning your first adventure. Your next great story starts here." action="Create your first trip" href="/trips/new"/>;return <div className="trip-grid">{trips.map(trip=><TripCard key={trip.id} trip={trip} onDelete={onDelete}/>)}</div>;}
