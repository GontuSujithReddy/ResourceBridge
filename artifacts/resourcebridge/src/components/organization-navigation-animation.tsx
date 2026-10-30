import { Building2, Globe2, UsersRound } from 'lucide-react';
import type { CSSProperties } from 'react';
import './organization-navigation-animation.css';
import { OrganizationPixelEnding } from './organization-pixel-ending';

/** A decorative community network, never an organization verification result. */
export function OrganizationNavigationAnimation() {
  return <div className="rb-org-motion rb-org-pixel-ending" aria-hidden="true">
    <div className="rb-org-aura"/>
    <div className="rb-org-scene">
      <div className="rb-org-floor"><span/><span/><span/></div>
      {[0, 1, 2].map(index => <div className={`rb-org-orbit-plane rb-org-orbit-plane-${index}`} key={index}>
        <div className="rb-org-orbit"><i/><i/></div>
      </div>)}
      <svg className="rb-org-connections" viewBox="0 0 260 260">
        <path d="M130 130 47 61M130 130 213 61M130 130 43 189M130 130 217 189"/>
        <circle cx="130" cy="130" r="78"/>
      </svg>
      <div className="rb-org-core">
        <div className="rb-org-cube">
          {['front', 'back', 'left', 'right', 'top', 'bottom'].map(face => <div className={`rb-org-face rb-org-face-${face}`} key={face}>
            {face === 'front' || face === 'back' ? <UsersRound size={36} strokeWidth={1.6}/> : <Building2 size={30} strokeWidth={1.5}/>}
          </div>)}
        </div>
      </div>
      {[Building2, Globe2, UsersRound, Building2].map((Icon, index) => <div
        className={`rb-org-satellite rb-org-satellite-${index}`}
        style={{ '--org-index': index } as CSSProperties}
        key={index}
      ><Icon size={22} strokeWidth={1.7}/><span/></div>)}
      {Array.from({ length: 8 }, (_, index) => <span
        className="rb-org-particle"
        style={{ '--org-angle': `${index * 45}deg`, '--org-index': index } as CSSProperties}
        key={index}
      />)}
    </div>
    <OrganizationPixelEnding/>
  </div>;
}
