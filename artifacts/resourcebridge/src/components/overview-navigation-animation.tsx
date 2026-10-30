import { Activity, Layers3, Sparkles } from 'lucide-react';
import './overview-navigation-animation.css';

/** Decorative dashboard sculpture, not a representation of live account data. */
export function OverviewNavigationAnimation() {
  return <div className="rb-overview-motion" aria-hidden="true">
    <span className="rb-overview-bloom"/>
    <div className="rb-overview-platform"><i/><i/><i/></div>
    <div className="rb-overview-sculpture">
      <div className="rb-overview-glass rb-overview-glass-back"/>
      <div className="rb-overview-glass rb-overview-glass-middle"/>
      <div className="rb-overview-glass rb-overview-glass-front">
        <div className="rb-overview-mini-header"><Activity size={15}/><span/><i/><i/></div>
        <div className="rb-overview-mini-sidebar"><i/><i/><i/><i/></div>
        <div className="rb-overview-pulse-window">
          <svg viewBox="0 0 160 66" fill="none">
            <path className="rb-overview-pulse-baseline" d="M4 38H30L41 25 53 43 70 10 87 58 100 30 112 38H156"/>
            <path className="rb-overview-pulse-energy" pathLength="100" d="M4 38H30L41 25 53 43 70 10 87 58 100 30 112 38H156"/>
          </svg>
          <span className="rb-overview-scan"/>
        </div>
        <div className="rb-overview-mini-tiles"><i/><i/><i/></div>
        <span className="rb-overview-glass-reflection"/>
      </div>
      <div className="rb-overview-floating-icon rb-overview-floating-pulse"><Activity size={33} strokeWidth={1.8}/></div>
      <div className="rb-overview-floating-icon rb-overview-floating-layers"><Layers3 size={23}/></div>
      <div className="rb-overview-floating-icon rb-overview-floating-spark"><Sparkles size={23}/></div>
    </div>
    <div className="rb-overview-light-orbit"><span/><i/></div>
    <div className="rb-overview-light-orbit rb-overview-light-orbit-alt"><span/><i/></div>
    <span className="rb-overview-dust rb-overview-dust-one"/>
    <span className="rb-overview-dust rb-overview-dust-two"/>
    <span className="rb-overview-dust rb-overview-dust-three"/>
  </div>;
}
