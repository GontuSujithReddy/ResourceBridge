import { ArrowUpRight, MessageSquareText } from 'lucide-react';
import './requests-navigation-animation.css';

/** A decorative request dispatch, not a submission or approval confirmation. */
export function RequestsNavigationAnimation() {
  return <div className="rb-requests-motion" aria-hidden="true">
    <span className="rb-requests-aura"/>
    <span className="rb-requests-shadow"/>
    <svg className="rb-requests-trails" viewBox="0 0 340 300" fill="none">
      <defs>
        <linearGradient id="rb-request-trail" x1="20" y1="240" x2="320" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#74bcd7" stopOpacity="0"/>
          <stop offset=".5" stopColor="#70c7eb"/>
          <stop offset="1" stopColor="#3a78cc" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path className="rb-requests-trail" d="M 30 225 C 115 295 290 195 262 105 C 241 40 106 60 120 126 C 132 183 263 116 320 38" stroke="url(#rb-request-trail)" strokeWidth="2"/>
      <path className="rb-requests-trail rb-requests-trail-soft" d="M 12 230 C 107 310 309 189 277 99 C 252 25 91 51 104 132 C 117 204 280 121 328 33" stroke="url(#rb-request-trail)"/>
    </svg>
    <div className="rb-requests-envelope">
      <span className="rb-requests-envelope-back"/>
      <span className="rb-requests-envelope-flap"/>
      <div className="rb-requests-letter">
        <span className="rb-requests-letter-heading"><MessageSquareText size={25} strokeWidth={1.6}/><i/></span>
        <span className="rb-requests-letter-line"/>
        <span className="rb-requests-letter-line short"/>
        <span className="rb-requests-letter-footer"><i/><ArrowUpRight size={18}/></span>
        <span className="rb-requests-scan"/>
      </div>
      <span className="rb-requests-envelope-front"/>
      <span className="rb-requests-envelope-edge"/>
    </div>
    <div className="rb-requests-plane">
      <span className="rb-requests-plane-left"/>
      <span className="rb-requests-plane-right"/>
      <span className="rb-requests-plane-keel"/>
      <span className="rb-requests-plane-glow"/>
    </div>
    <span className="rb-requests-satellite rb-requests-satellite-one"/>
    <span className="rb-requests-satellite rb-requests-satellite-two"/>
    <span className="rb-requests-satellite rb-requests-satellite-three"/>
  </div>;
}
