import type { ReactNode } from 'react';
import { Activity, ArrowRight, ArrowUpRight, CalendarDays, Check, Clock3, Drill, MapPin, UsersRound, Wrench, X } from 'lucide-react';
import { Link } from 'wouter';
import type { ResourceBridgeActivity, ResourceBridgeBooking } from '@workspace/api-client-react';
import './community-pulse-dashboard.css';

type AccountType = 'owner' | 'customer';
type BookingDecision = 'approved' | 'rejected';

type CommunityPulseDashboardProps = {
  accountType: AccountType;
  displayName: string;
  ratingBadge: ReactNode;
  ownedResources: number;
  incomingRequests: number;
  bookedResourceCount: number;
  openCustomerRequests: number;
  upcomingBookings: ResourceBridgeBooking[];
  recentActivity: ResourceBridgeActivity[];
  pendingRequest?: ResourceBridgeBooking;
  decisionPending: boolean;
  onDecideRequest: (booking: ResourceBridgeBooking, decision: BookingDecision) => void;
};

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatBookingRange(booking: ResourceBridgeBooking) {
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return 'Date unavailable';
  const date = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(start);
  const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time.format(start)}–${time.format(end)}`;
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Recently';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
}

function BookingCard({ booking }: { booking: ResourceBridgeBooking }) {
  const statusTone = booking.status === 'pending_approval' || booking.status === 'pending_requirements'
    ? 'pending'
    : ['rejected', 'cancelled'].includes(booking.status)
      ? 'declined'
      : 'confirmed';

  return (
    <article className="cp-booking" data-testid={`booking-row-community-pulse-${booking.id}`}>
      <div className="cp-date-tile">
        <strong>{new Date(booking.startAt).getDate()}</strong>
        <small>{new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(booking.startAt)).toUpperCase()}</small>
      </div>
      <div className="cp-booking-copy">
        <div className="cp-booking-title">
          <strong>{booking.resourceName}</strong>
          <span className={`cp-status ${statusTone}`}><i />{booking.status.replaceAll('_', ' ')}</span>
        </div>
        <p>{booking.purpose || `${booking.teamSize} ${booking.teamSize === 1 ? 'person' : 'people'}`}</p>
        <small className="cp-booking-place"><CalendarDays size={12} />{formatBookingRange(booking)}</small>
      </div>
      <Link
        href="/bookings"
        className="cp-row-arrow"
        aria-label={`View booking for ${booking.resourceName}`}
        data-testid={`link-community-pulse-booking-${booking.id}`}
      >
        <ArrowUpRight size={16} />
      </Link>
    </article>
  );
}

export function CommunityPulseDashboard({
  accountType,
  displayName,
  ratingBadge,
  ownedResources,
  incomingRequests,
  bookedResourceCount,
  openCustomerRequests,
  upcomingBookings,
  recentActivity,
  pendingRequest,
  decisionPending,
  onDecideRequest,
}: CommunityPulseDashboardProps) {
  const isOwner = accountType === 'owner';
  const firstName = displayName.trim().split(/\s+/)[0] || 'there';
  const requestCount = isOwner ? incomingRequests : openCustomerRequests;
  const primaryCount = isOwner ? ownedResources : bookedResourceCount;
  const primaryLabel = isOwner ? 'resources hosted' : 'resources booked';
  const nextBooking = upcomingBookings[0];
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <main className="cp-page" data-testid="page-community-pulse">
      <div className="cp-shell">
        <div className="cp-content">
          <section className="cp-intro">
            <div>
              <div className="cp-eyebrow">
                <span className="cp-eyebrow-dot" />
                COMMUNITY PULSE
                <span className="cp-eyebrow-date">· {today.toUpperCase()}</span>
              </div>
              <h1 data-testid="heading-community-pulse">{greetingForNow()}, {firstName}.</h1>
              <p>{isOwner ? 'Here’s what your shared resources are setting in motion.' : 'Your resource visits and requests, all in one place.'}</p>
            </div>
            <div className="cp-intro-right">
              <div className="cp-rating-slot">{ratingBadge}</div>
              {isOwner && (
                <Link className="cp-add-button" href="/resources/new" data-testid="button-dashboard-add-resource">
                  <Drill size={16} /> Add a resource
                </Link>
              )}
            </div>
          </section>

          <section className="cp-pulse-layout" aria-label={isOwner ? 'Host community pulse' : 'Customer community pulse'}>
            <article className="cp-attention">
              <div className="cp-section-kicker"><span className="cp-signal" /> NEXT UP</div>
              <div className="cp-attention-heading">
                <div>
                  <h2>{isOwner ? 'Your attention' : 'Your next steps'}</h2>
                  <p>{requestCount ? `${requestCount} ${isOwner ? 'requests are waiting on you' : 'requests are waiting for a host'}` : 'You’re all caught up'}</p>
                </div>
                <span className="cp-count" data-testid="value-community-pulse-requests">{requestCount}</span>
              </div>

              {isOwner && pendingRequest ? (
                <div className="cp-request-card" data-testid={`card-community-pulse-request-${pendingRequest.id}`}>
                  <div className="cp-request-top">
                    <span className="cp-request-tag"><span /> NEW REQUEST</span>
                    <span className="cp-request-time"><Clock3 size={12} />{formatRelativeTime(pendingRequest.createdAt)}</span>
                  </div>
                  <div className="cp-request-resource">
                    <Drill size={15} />
                    <span>
                      <strong>{pendingRequest.resourceName}</strong>
                      <small>{formatBookingRange(pendingRequest)}</small>
                    </span>
                  </div>
                  <p className="cp-request-message">{pendingRequest.purpose}</p>
                  <div className="cp-request-details">
                    <span>{pendingRequest.teamSize} {pendingRequest.teamSize === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="cp-request-actions">
                    <button
                      className="cp-approve"
                      onClick={() => onDecideRequest(pendingRequest, 'approved')}
                      disabled={decisionPending}
                      data-testid={`button-community-pulse-approve-${pendingRequest.id}`}
                    >
                      <Check size={14} /> Approve request
                    </button>
                    <button
                      className="cp-decline"
                      onClick={() => onDecideRequest(pendingRequest, 'rejected')}
                      disabled={decisionPending}
                      data-testid={`button-community-pulse-decline-${pendingRequest.id}`}
                    >
                      <X size={12} /> Decline
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cp-next-card" data-testid="card-community-pulse-next">
                  <span className="cp-next-icon"><CalendarDays size={18} /></span>
                  <div>
                    <small>{nextBooking ? (isOwner ? 'NEXT BOOKING' : 'UPCOMING ACCESS') : (isOwner ? 'REQUEST INBOX' : 'RESOURCE EXPLORER')}</small>
                    <strong>
                      {nextBooking
                        ? nextBooking.resourceName
                        : isOwner
                          ? (requestCount ? 'Requests need your review' : 'No requests need a reply')
                          : (requestCount ? 'Waiting for a host response' : 'Find a resource to book')}
                    </strong>
                    <p>{nextBooking ? formatBookingRange(nextBooking) : (isOwner ? 'New requests will appear in your inbox.' : 'Browse spaces, tools, and services nearby.')}</p>
                  </div>
                  <ArrowRight size={16} />
                </div>
              )}

              <div className="cp-attention-footer">
                <span><span className="cp-green-dot" />{isOwner ? 'Your listings are visible to the network' : 'Your account is ready to book'}</span>
                <Link href={isOwner ? '/requests' : '/explore'} data-testid="link-community-pulse-next-action">
                  {isOwner ? 'Request inbox' : 'Explore resources'} <ArrowRight size={13} />
                </Link>
              </div>
            </article>

            <aside className="cp-impact">
              <div className="cp-impact-head">
                <div>
                  <div className="cp-section-kicker">SHARED CAPACITY</div>
                  <h2>{isOwner ? 'Your community impact' : 'Your access so far'}</h2>
                </div>
                <span className="cp-impact-mark" aria-hidden="true"><Activity size={16} /></span>
              </div>
              <div className="cp-impact-number" data-testid="value-community-pulse-primary">
                {primaryCount}
                <span>{primaryLabel}</span>
              </div>
              <p className="cp-impact-copy">
                {isOwner ? 'Resources you make available can support more local ideas.' : 'Your bookings help keep useful resources in circulation.'}
              </p>
              <div className="cp-impact-divider" />
              <div className="cp-impact-stats">
                <div>
                  <span className="cp-mini-icon blue"><UsersRound size={15} /></span>
                  <span><strong data-testid="value-community-pulse-secondary">{requestCount}</strong><small>{isOwner ? 'requests to review' : 'requests in progress'}</small></span>
                </div>
                <div>
                  <span className="cp-mini-icon green"><CalendarDays size={15} /></span>
                  <span><strong data-testid="value-community-pulse-upcoming">{upcomingBookings.length}</strong><small>{isOwner ? 'upcoming bookings' : 'upcoming visits'}</small></span>
                </div>
              </div>
            </aside>
          </section>

          <section className="cp-bottom-grid">
            <article className="cp-agenda">
              <div className="cp-block-heading">
                <div><span className="cp-section-kicker">ON THE CALENDAR</span><h2>{isOwner ? 'Coming up' : 'Your upcoming access'}</h2></div>
                <Link className="cp-text-link" href="/bookings" data-testid="link-community-pulse-bookings">
                  All bookings <ArrowRight size={14} />
                </Link>
              </div>
              {upcomingBookings.length ? (
                <div className="cp-booking-list">
                  {upcomingBookings.slice(0, 4).map((booking) => <BookingCard booking={booking} key={booking.id} />)}
                </div>
              ) : (
                <div className="cp-agenda-empty" data-testid="status-community-pulse-no-bookings">
                  <CalendarDays size={18} />
                  <span>{isOwner ? 'Approved bookings will appear here.' : 'Your approved visits will appear here.'}</span>
                  {!isOwner && <Link href="/explore" data-testid="link-community-pulse-discover">Discover resources</Link>}
                </div>
              )}
            </article>

            <article className="cp-activity">
              <div className="cp-block-heading">
                <div><span className="cp-section-kicker">AROUND THE NETWORK</span><h2>Community activity</h2></div>
                <span className="cp-live-label"><i /> RECENT</span>
              </div>
              {recentActivity.length ? (
                <div className="cp-activity-list">
                  {recentActivity.slice(0, 5).map((item, index) => (
                    <article className="cp-activity-item" key={item.id} data-testid={`activity-row-community-pulse-${item.id}`}>
                      <span className={`cp-activity-icon ${index === 0 ? 'blue' : index === 1 ? 'green' : 'gold'}`}>
                        {index === 0 ? <UsersRound size={15} /> : index === 1 ? <Check size={15} /> : <Wrench size={15} />}
                      </span>
                      <div>
                        <strong>{item.action}</strong>
                        <p>{item.entityName} · {item.actorLabel}</p>
                        <small>{formatRelativeTime(item.createdAt)}</small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="cp-activity-empty" data-testid="status-community-pulse-no-activity">
                  <Activity size={17} />
                  <span>Your recent sharing activity will appear here.</span>
                </div>
              )}
              <Link className="cp-activity-more" href="/bookings" data-testid="link-community-pulse-activity">
                View bookings <ArrowRight size={13} />
              </Link>
            </article>
          </section>

          <footer className="cp-footer">
            <span><span className="cp-footer-spark"><Activity size={13} /></span> Every shared resource makes room for someone else.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
