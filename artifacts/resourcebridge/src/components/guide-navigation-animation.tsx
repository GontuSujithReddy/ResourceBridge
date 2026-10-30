import { BookOpen, CalendarDays, Handshake, Search } from 'lucide-react';
import type { CSSProperties } from 'react';
import './guide-navigation-animation.css';
import './guide-navigation-effects.css';

/** A decorative guide preview, not completed actions or account progress. */
export function GuideNavigationAnimation() {
  return <div className="rb-guide-motion" aria-hidden="true">
    <span className="rb-guide-aura"/>
    <div className="rb-guide-platform"><i/><i/><i/></div>
    <svg className="rb-guide-connection" viewBox="0 0 280 100" fill="none">
      <path pathLength="100" d="M48 65Q90 6 140 42Q193 77 233 33"/>
    </svg>
    {[Search, CalendarDays, Handshake].map((Icon, index) => <div key={index}
      className={`rb-guide-step rb-guide-step-${index}`} style={{ '--guide-step': index } as CSSProperties}
    ><Icon size={22} strokeWidth={1.6}/><span>{index + 1}</span></div>)}
    <div className="rb-guide-gate-fx">
      {Array.from({ length: 4 }, (_, index) => <i key={index} style={{ '--gate': index } as CSSProperties}/>)}
      {Array.from({ length: 8 }, (_, index) => <span key={index} style={{ '--leaf-angle': `${index * 45}deg` } as CSSProperties}/>)}
    </div>
    <div className="rb-guide-doorway"><i/><i/><span/></div>
    <div className="rb-guide-book">
      <div className="rb-guide-book-base"/>
      <div className="rb-guide-closing-cover"><BookOpen size={31} strokeWidth={1.5}/></div>
      <div className="rb-guide-left-page">
        <div className="rb-guide-cover-icon"><BookOpen size={31} strokeWidth={1.5}/></div>
        <div className="rb-guide-lines"><i/><i/><i/></div>
      </div>
      <div className="rb-guide-right-page">
        <div className="rb-guide-page-heading"/>
        <div className="rb-guide-page-steps"><span>1<i/></span><span>2<i/></span><span>3<i/></span></div>
        <span className="rb-guide-page-glow"/>
      </div>
      <div className="rb-guide-turning-page"><div className="rb-guide-lines"><i/><i/><i/><i/></div></div>
      <span className="rb-guide-book-spine"/>
      <span className="rb-guide-bookmark"/>
    </div>
    <span className="rb-guide-light-trail"/>
    <span className="rb-guide-light-trail rb-guide-light-trail-alt"/>
    <span className="rb-guide-spark rb-guide-spark-one">✦</span>
    <span className="rb-guide-spark rb-guide-spark-two">✦</span>
  </div>;
}
