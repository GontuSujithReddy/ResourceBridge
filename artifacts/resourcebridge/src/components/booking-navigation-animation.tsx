import { CalendarDays } from 'lucide-react';
import './booking-navigation-animation.css';

/** Decorative navigation feedback only; this does not confirm a booking. */
export function BookingNavigationAnimation() {
  return <div className="rb-booking-motion" aria-hidden="true">
    <span className="rb-booking-halo"/>
    <span className="rb-booking-shadow"/>
    <span className="rb-booking-exit-ring"/>
    <span className="rb-booking-exit-ring rb-booking-exit-ring-inner"/>
    <div className="rb-booking-calendar">
      <span className="rb-booking-calendar-edge"/>
      <div className="rb-booking-calendar-face">
        <div className="rb-booking-calendar-header"><i/><i/></div>
        <div className="rb-booking-calendar-days">
          {Array.from({ length: 12 }, (_, index) => <span key={index} className={index === 6 ? 'selected' : undefined}/>)}
        </div>
      </div>
      <div className="rb-booking-calendar-page">
        <div className="rb-booking-calendar-days">
          {Array.from({ length: 12 }, (_, index) => <span key={index}/>)}
        </div>
      </div>
      <div className="rb-booking-closing-cover"><CalendarDays size={37} strokeWidth={1.4}/></div>
      <span className="rb-booking-calendar-shine"/>
    </div>
    {[0, 1, 2, 3].map(index => <span key={index} className={`rb-booking-spark rb-booking-spark-${index}`}>✦</span>)}
  </div>;
}
