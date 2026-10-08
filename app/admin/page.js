'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import Loader from '@/components/ui/Loader';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/dates';

export default function Admin(){
  const [stats,setStats]=useState(null),[users,setUsers]=useState([]),[trips,setTrips]=useState([]),[reviews,setReviews]=useState([]),[messages,setMessages]=useState([]);
  const [error,setError]=useState(''),[loading,setLoading]=useState(true),[adminId,setAdminId]=useState(null);
  const [userPage,setUserPage]=useState(1),[tripPage,setTripPage]=useState(1),[userPages,setUserPages]=useState(1),[tripPages,setTripPages]=useState(1);
  const [selectedTrip,setSelectedTrip]=useState(null),[tripDetail,setTripDetail]=useState(null),[detailLoading,setDetailLoading]=useState(false);

  const load=useCallback(async()=>{
    try{
      const [s,u,t,m,rv,msg]=await Promise.all([
        api.get('/admin/stats'),api.get(`/admin/users?page=${userPage}&limit=20`),api.get(`/admin/trips?page=${tripPage}&limit=20`),api.get('/auth/me'),api.get('/admin/reviews'),api.get('/admin/messages'),
      ]);
      setStats(s.data.data.stats);setUsers(u.data.data.users);setTrips(t.data.data.trips);setReviews(rv.data.data.reviews);setMessages(msg.data.data.messages);
      setUserPages(u.data.data.pagination.pages);setTripPages(t.data.data.pagination.pages);setAdminId(m.data.data.user.id);setError('');
    }catch(e){setError(e.response?.data?.message||'Unable to load admin data.');}
    finally{setLoading(false);}
  },[userPage,tripPage]);
  useEffect(()=>{load();},[load]);

  async function toggleUser(user){try{await api.patch('/admin/users',{id:user.id,status:user.status==='ACTIVE'?'DISABLED':'ACTIVE'});await load();}catch(e){setError(e.response?.data?.message||'Unable to update user.');}}
  async function deleteUser(user){if(!window.confirm(`Delete user account for ${user.name}? Their trips will also be deleted.`))return;try{await api.delete(`/admin/users?id=${user.id}`);await load();}catch(e){setError(e.response?.data?.message||'Unable to delete user.');}}
  async function deleteTrip(trip){if(!window.confirm(`Delete trip ${trip.trip_name}?`))return;try{await api.delete(`/admin/trips?id=${trip.id}`);if(selectedTrip===trip.id){setSelectedTrip(null);setTripDetail(null);}await load();}catch(e){setError(e.response?.data?.message||'Unable to delete trip.');}}
  async function showItinerary(trip){if(selectedTrip===trip.id){setSelectedTrip(null);setTripDetail(null);return;}setSelectedTrip(trip.id);setTripDetail(null);setDetailLoading(true);try{const r=await api.get(`/admin/trips/${trip.id}`);setTripDetail(r.data.data);}catch(e){setError(e.response?.data?.message||'Unable to load this itinerary.');}finally{setDetailLoading(false);}}
  async function setReviewStatus(review){const status=review.status==='PUBLISHED'?'HIDDEN':'PUBLISHED';try{await api.patch('/admin/reviews',{id:review.id,status});await load();}catch(e){setError(e.response?.data?.message||'Unable to update review.');}}
  async function setMessageStatus(message){const status=message.status==='CLOSED'?'NEW':message.status==='NEW'?'READ':'CLOSED';try{await api.patch('/admin/messages',{id:message.id,status});await load();}catch(e){setError(e.response?.data?.message||'Unable to update message.');}}

  if(loading)return <div className="page-shell"><Loader label="Loading admin dashboard..."/></div>;
  const statCards=[['Total users',stats?.totalUsers,'all registered accounts'],['New users',stats?.newUsersLast30Days,'joined in the last 30 days'],['Active users',stats?.activeUsers,'accounts ready to plan'],['Trips planned',stats?.totalTrips,'stored in TripPlanner'],['Trips completed',stats?.completedTrips,'end date has passed'],['Upcoming trips',stats?.upcomingTrips,'still on the calendar'],['Published reviews',stats?.publishedReviews,'traveller stories']];

  return <div className="page-shell admin-page">
    <div className="page-heading admin-heading"><div><span className="eyebrow">TRIPPLANNER ADMIN CONSOLE</span><h1>Admin dashboard</h1><p>See who has joined, what they are planning, and how their journeys are going.</p></div><button className="button button-secondary admin-refresh" onClick={load}>Refresh dashboard</button></div>
    <nav className="admin-jump-links" aria-label="Admin dashboard sections"><a href="#admin-users">Users</a><a href="#admin-trips">Trips</a><a href="#admin-reviews">Reviews</a><a href="#admin-messages">Contact messages</a></nav>
    {error&&<div className="error-box" role="alert">{error}<button className="button button-quiet" onClick={load}>Try again</button></div>}
    <section className="stats-grid admin-stats-grid">{statCards.map(([label,value,note],index)=><div className="stat-card glass admin-stat-card" key={label}><span className="admin-stat-index">0{index+1}</span><span>{label}</span><strong>{value??0}</strong><small>{note}</small></div>)}</section>

    <section className="section-block admin-section" id="admin-users"><div className="section-heading"><div><span className="eyebrow">COMMUNITY</span><h2>Users</h2></div></div><div className="table-wrap glass"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead><tbody>{users.map(user=><tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td><span className={`status-pill ${user.status==='ACTIVE'?'upcoming':'completed'}`}>{user.status}</span></td><td>{user.created_at?.slice(0,10)}</td><td><button className="button button-quiet" onClick={()=>toggleUser(user)}>{user.status==='ACTIVE'?'Disable':'Activate'}</button>{user.id!==adminId&&<button className="button button-quiet danger-text" onClick={()=>deleteUser(user)}>Delete</button>}</td></tr>)}</tbody></table>{!users.length&&<p className="table-empty">No users found.</p>}</div><Pagination page={userPage} pages={userPages} onPage={setUserPage}/></section>

    <section className="section-block admin-section" id="admin-trips"><div className="section-heading"><div><span className="eyebrow">TRAVEL PLANS</span><h2>All trips and itineraries</h2></div></div><div className="table-wrap glass"><table><thead><tr><th>Trip</th><th>Destination</th><th>Owner</th><th>Dates</th><th>Budget</th><th>Details</th></tr></thead><tbody>{trips.map(trip=><tr key={trip.id}><td>{trip.trip_name}</td><td>{trip.destination}</td><td>{trip.owner_name}<small className="table-sub">{trip.owner_email}</small></td><td>{formatDate(trip.start_date)} to {formatDate(trip.end_date)}</td><td>{formatMoney(trip.budget)}</td><td><button className="button button-quiet" onClick={()=>showItinerary(trip)}>{selectedTrip===trip.id?'Hide':'Itinerary'}</button><button className="button button-quiet danger-text" onClick={()=>deleteTrip(trip)}>Delete</button></td></tr>)}</tbody></table>{!trips.length&&<p className="table-empty">No trips found.</p>}</div><Pagination page={tripPage} pages={tripPages} onPage={setTripPage}/>
      {selectedTrip&&<div className="admin-itinerary glass">{detailLoading?<Loader label="Loading itinerary..."/>:tripDetail&&<><span className="eyebrow">TRIP ITINERARY</span><h3>{tripDetail.trip.trip_name}  {tripDetail.trip.destination}</h3>{tripDetail.itinerary.length?tripDetail.itinerary.map(item=><div className="admin-itinerary-row" key={item.id}><span>Day {item.day_number}</span><strong>{item.start_time?.slice(0,5)||'Any time'}  {item.activity}</strong><small>{item.location||'Location not set'}{item.notes?`  ${item.notes}`:''}</small></div>):<p className="muted">No activities have been added to this trip yet.</p>}</>}</div>}
    </section>

    <section className="section-block admin-section" id="admin-reviews"><div className="section-heading"><div><span className="eyebrow">TRAVELLER STORIES</span><h2>Reviews</h2></div></div><div className="table-wrap glass"><table><thead><tr><th>Traveller</th><th>Rating</th><th>Review</th><th>Status</th><th>Action</th></tr></thead><tbody>{reviews.map(review=><tr key={review.id}><td>{review.name}<small className="table-sub">{review.email}</small></td><td><span className="admin-rating">{review.rating} / 5</span></td><td className="admin-review-text">{review.review_text}</td><td>{review.status}</td><td><button className="button button-quiet" onClick={()=>setReviewStatus(review)}>{review.status==='PUBLISHED'?'Hide':'Publish'}</button></td></tr>)}</tbody></table>{!reviews.length&&<p className="table-empty">No reviews yet.</p>}</div></section>

    <section className="section-block admin-section" id="admin-messages"><div className="section-heading"><div><span className="eyebrow">INBOX</span><h2>Contact messages</h2></div></div><div className="table-wrap glass"><table><thead><tr><th>From</th><th>Subject</th><th>Message</th><th>Received</th><th>Status</th><th>Action</th></tr></thead><tbody>{messages.map(message=><tr key={message.id}><td>{message.name}<small className="table-sub">{message.email}</small></td><td>{message.subject}</td><td className="admin-review-text">{message.message}</td><td>{message.created_at?.slice(0,16)}</td><td>{message.status}</td><td><button className="button button-quiet" onClick={()=>setMessageStatus(message)}>{message.status==='CLOSED'?'Reopen':message.status==='NEW'?'Mark read':'Close'}</button></td></tr>)}</tbody></table>{!messages.length&&<p className="table-empty">No contact messages yet.</p>}</div></section>
  </div>;
}

function Pagination({page,pages,onPage}){return <div className="pagination-controls admin-pagination"><button className="button button-quiet" disabled={page<=1} onClick={()=>onPage(page-1)}>Previous</button><span>Page {page} of {pages}</span><button className="button button-quiet" disabled={page>=pages} onClick={()=>onPage(page+1)}>Next</button></div>;}