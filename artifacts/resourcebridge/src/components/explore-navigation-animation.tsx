import { Building2, FlaskConical, Hammer, Laptop } from 'lucide-react';
import type { CSSProperties } from 'react';
import './explore-navigation-animation.css';

/** Decorative discovery scene; it does not imply an account or location search. */
export function ExploreNavigationAnimation() {
  return <div className="rb-discovery-motion" aria-hidden="true">
    <span className="rb-discovery-aura"/>
    <div className="rb-discovery-cloud rb-discovery-cloud-back"><i/><i/><i/><i/><i/></div>
    <div className="rb-discovery-map">
      {[0, 1].map(half => <div key={half} className={`rb-discovery-map-wing rb-discovery-map-wing-${half}`}>
      <svg viewBox={`${half * 125} 0 125 160`} fill="none">
        <path className="rb-discovery-map-grid" d="M0 40H250M0 80H250M0 120H250M50 0V160M100 0V160M150 0V160M200 0V160"/>
        <path className="rb-discovery-route" pathLength="100" d="M28 127 65 127 65 90 125 90 125 43 202 43"/>
        <circle cx="28" cy="127" r="4"/><circle cx="202" cy="43" r="4"/>
      </svg>
      </div>)}
    </div>
    <div className="rb-discovery-compass">
      <span className="rb-discovery-compass-base"/>
      <div className="rb-discovery-compass-face">
        <span className="rb-discovery-ticks"/>
        <div className="rb-discovery-dial">
          <i className="rb-discovery-crosshair"/>
          <span className="rb-discovery-scan"/>
          <span className="rb-discovery-north">N</span>
          <span className="rb-discovery-east">E</span>
          <span className="rb-discovery-south">S</span>
          <span className="rb-discovery-west">W</span>
          <svg className="rb-discovery-needle" viewBox="0 0 100 100">
            <path d="M50 12 64 51 50 47 36 51Z" fill="#f4fcff"/>
            <path d="M50 88 36 49 50 53 64 49Z" fill="#80b1ed"/>
            <circle cx="50" cy="50" r="5" fill="#e6f7ff" stroke="#abcffa" strokeWidth="2"/>
          </svg>
        </div>
        <span className="rb-discovery-lens"/>
      </div>
    </div>
    <span className="rb-discovery-map-vortex"/>
    <div className="rb-discovery-wave"><span/><span/></div>
    {[Building2, Laptop, Hammer, FlaskConical].map((Icon, index) => <div
      className={`rb-discovery-resource rb-discovery-resource-${index}`}
      key={index} style={{ '--discovery-index': index } as CSSProperties}
    ><Icon size={23} strokeWidth={1.7}/><span/></div>)}
    <span className="rb-discovery-trail rb-discovery-trail-one"/>
    <span className="rb-discovery-trail rb-discovery-trail-two"/>
    <div className="rb-discovery-cloud rb-discovery-cloud-front"><i/><i/><i/><i/><i/></div>
  </div>;
}
