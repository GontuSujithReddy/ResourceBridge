import { Sparkles, UserRound, UsersRound } from 'lucide-react';
import './team-navigation-animation.css';

/** Decorative team reveal: people connect across a shared bridge, not a membership result. */
export function TeamNavigationAnimation() {
  return <div className="rb-team-motion" aria-hidden="true" data-testid="animation-team-reveal">
    <span className="rb-team-aura"/>
    <div className="rb-team-stage">
      <div className="rb-team-floor"><i/><i/><i/></div>
      <svg className="rb-team-bridge" viewBox="0 0 300 250">
        <path className="rb-team-bridge-outer" d="M31 153 C68 84 104 66 150 66 C196 66 232 84 269 153"/>
        <path className="rb-team-bridge-inner" d="M52 154 C85 112 112 99 150 99 C188 99 215 112 248 154"/>
        <path className="rb-team-link rb-team-link-left" d="M74 120 C92 148 116 157 150 160"/>
        <path className="rb-team-link rb-team-link-right" d="M226 120 C208 148 184 157 150 160"/>
      </svg>
      <div className="rb-team-center">
        <div className="rb-team-center-cube">
          <div className="rb-team-cube-face rb-team-cube-front"><UsersRound size={38} strokeWidth={1.5}/></div>
          <div className="rb-team-cube-face rb-team-cube-back"><Sparkles size={32} strokeWidth={1.5}/></div>
        </div>
      </div>
      <div className="rb-team-member rb-team-member-left"><span className="rb-team-avatar"><UserRound size={22}/></span><i/></div>
      <div className="rb-team-member rb-team-member-top"><span className="rb-team-avatar"><UserRound size={22}/></span><i/></div>
      <div className="rb-team-member rb-team-member-right"><span className="rb-team-avatar"><UserRound size={22}/></span><i/></div>
      <div className="rb-team-orbit rb-team-orbit-a"/>
      <div className="rb-team-orbit rb-team-orbit-b"/>
      {Array.from({ length: 10 }, (_, index) => <span className={`rb-team-particle rb-team-particle-${index}`} key={index}/>)}
    </div>
  </div>;
}
