import { Compass, HandHeart, ShieldCheck, Sparkles } from 'lucide-react';
import './about-navigation-animation.css';

/** Decorative purpose reveal; the scene describes sharing, not an account or booking outcome. */
export function AboutNavigationAnimation() {
  return <div className="rb-about-motion" aria-hidden="true" data-testid="animation-about-reveal">
    <span className="rb-about-aura"/>
    <div className="rb-about-stage">
      <div className="rb-about-platform"><i/><i/><i/></div>
      <svg className="rb-about-paths" viewBox="0 0 300 250">
        <path d="M150 125 C115 104 94 82 67 57"/>
        <path d="M150 125 C150 95 150 72 150 42"/>
        <path d="M150 125 C185 104 206 82 233 57"/>
        <circle cx="150" cy="125" r="79"/>
      </svg>
      <div className="rb-about-core">
        <div className="rb-about-core-turn">
          <div className="rb-about-core-face rb-about-core-front"><HandHeart size={39} strokeWidth={1.5}/></div>
          <div className="rb-about-core-face rb-about-core-back"><Sparkles size={32} strokeWidth={1.5}/></div>
        </div>
      </div>
      <div className="rb-about-resource rb-about-resource-left"><Compass size={23}/><span/></div>
      <div className="rb-about-resource rb-about-resource-top"><ShieldCheck size={23}/><span/></div>
      <div className="rb-about-resource rb-about-resource-right"><Sparkles size={23}/><span/></div>
      <div className="rb-about-orbit rb-about-orbit-a"/>
      <div className="rb-about-orbit rb-about-orbit-b"/>
      {Array.from({ length: 9 }, (_, index) => <i className={`rb-about-light rb-about-light-${index}`} key={index}/>)}
    </div>
  </div>;
}
