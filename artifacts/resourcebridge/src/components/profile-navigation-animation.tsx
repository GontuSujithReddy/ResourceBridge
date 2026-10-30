import { Fingerprint, LockKeyhole, UserRound } from 'lucide-react';
import { ProfileExitEffects } from './profile-exit-effects';
import './profile-navigation-animation.css';

/** Generic navigation artwork: no identity check, biometrics, or account status. */
export function ProfileNavigationAnimation() {
  return <div className="rb-identity-motion" aria-hidden="true">
    <span className="rb-identity-aura"/>
    <div className="rb-identity-platform"><i/><i/><i/></div>
    <div className="rb-identity-scene">
      <div className="rb-identity-card-layer"/>
      <div className="rb-identity-card">
        <span className="rb-identity-card-notch"/>
        <div className="rb-identity-avatar"><UserRound size={37} strokeWidth={1.5}/></div>
        <div className="rb-identity-lines"><i/><i/><i/></div>
        <div className="rb-identity-card-details"><span/><span/><span/><span/></div>
        <span className="rb-identity-card-scan"/>
        <span className="rb-identity-card-reflection"/>
      </div>
      <div className="rb-identity-shield">
        <span className="rb-identity-shield-back"/>
        <div className="rb-identity-shield-face">
          <svg viewBox="0 0 100 116" fill="none">
            <path pathLength="100" d="M50 10 89 25V56C89 78 73 96 50 107 27 96 11 78 11 56V25Z"/>
          </svg>
          <LockKeyhole size={32} strokeWidth={1.7}/>
          <span className="rb-identity-shield-shine"/>
        </div>
      </div>
      <div className="rb-identity-fingerprint"><Fingerprint size={35} strokeWidth={1.3}/></div>
    </div>
    <ProfileExitEffects/>
    <div className="rb-identity-exit-light"><i/><i/><span/></div>
    <span className="rb-identity-orbit"/><span className="rb-identity-orbit rb-identity-orbit-alt"/>
    <span className="rb-identity-spark rb-identity-spark-one">✦</span>
    <span className="rb-identity-spark rb-identity-spark-two">✦</span>
  </div>;
}
