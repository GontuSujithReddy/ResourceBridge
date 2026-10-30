import { MessageCircle, Phone } from 'lucide-react';
import type { CSSProperties } from 'react';
import './support-navigation-animation.css';

/** Decorative navigation feedback only: no microphone, call, AI, or ticket action. */
export function SupportNavigationAnimation() {
  return <div className="rb-care-motion" aria-hidden="true">
    <span className="rb-care-aura"/>
    <div className="rb-care-platform"><i/><i/><i/></div>
    <div className="rb-care-headset">
      <div className="rb-care-headband"><span/></div>
      <div className="rb-care-ear rb-care-ear-left"><i/></div>
      <div className="rb-care-ear rb-care-ear-right"><i/></div>
      <div className="rb-care-voice-orb">
        <div className="rb-care-equalizer">
          {[.4, .75, 1, .6, .9, .5, .7].map((height, index) => <i key={index}
            style={{ '--care-height': height, '--care-index': index } as CSSProperties}/>)}
        </div>
      </div>
      <div className="rb-care-mic-arm"><span/></div>
      <span className="rb-care-headset-reflection"/>
    </div>
    <div className="rb-care-chat rb-care-chat-one">
      <MessageCircle size={21} strokeWidth={1.7}/>
      <div className="rb-care-typing"><i/><i/><i/></div>
    </div>
    <div className="rb-care-chat rb-care-chat-two">
      <Phone size={19} strokeWidth={1.7}/>
      <span className="rb-care-chat-line"/><span className="rb-care-chat-line short"/>
    </div>
    <svg className="rb-care-sound rb-care-sound-left" viewBox="0 0 40 70" fill="none">
      <path d="M30 24Q18 35 30 46"/><path d="M21 14Q0 35 21 56"/><path d="M11 4Q-16 35 11 66"/>
    </svg>
    <svg className="rb-care-sound rb-care-sound-right" viewBox="0 0 40 70" fill="none">
      <path d="M30 24Q18 35 30 46"/><path d="M21 14Q0 35 21 56"/><path d="M11 4Q-16 35 11 66"/>
    </svg>
    <svg className="rb-care-exit-wave" viewBox="0 0 180 50" fill="none">
      <path pathLength="100" d="M3 25H29L39 16 49 35 60 6 73 44 86 13 98 36 110 18 121 29 132 22 140 25H177"/>
    </svg>
    <span className="rb-care-light-ring"/><span className="rb-care-light-ring rb-care-light-ring-alt"/>
    <span className="rb-care-spark rb-care-spark-one">✦</span><span className="rb-care-spark rb-care-spark-two">✦</span>
  </div>;
}
