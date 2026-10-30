import { Building2, Settings2, SlidersHorizontal, UsersRound } from 'lucide-react';
import './admin-navigation-animation.css';

/** Decorative administration scene; does not grant access or change any roles. */
export function AdminNavigationAnimation() {
  return <div className="rb-admin-motion" aria-hidden="true">
    <span className="rb-admin-aura"/>
    <div className="rb-admin-platform"><i/><i/><i/></div>
    <div className="rb-admin-console">
      <div className="rb-admin-console-depth"/>
      <div className="rb-admin-wing rb-admin-wing-left">
        <UsersRound size={29} strokeWidth={1.5}/>
        <div className="rb-admin-member-lines"><i/><i/><i/></div>
        <span className="rb-admin-panel-shine"/>
      </div>
      <div className="rb-admin-wing rb-admin-wing-right">
        <SlidersHorizontal size={29} strokeWidth={1.5}/>
        <div className="rb-admin-controls"><i/><i/><i/></div>
        <span className="rb-admin-panel-shine"/>
      </div>
      <div className="rb-admin-console-face">
        <span className="rb-admin-console-header"><i/><i/><i/></span>
        <div className="rb-admin-dial"><span/><Settings2 size={44} strokeWidth={1.4}/></div>
        <div className="rb-admin-console-slots"><i/><i/><i/></div>
        <span className="rb-admin-panel-shine"/>
      </div>
    </div>
    <div className="rb-admin-satellite rb-admin-satellite-one"><Building2 size={22} strokeWidth={1.5}/></div>
    <div className="rb-admin-satellite rb-admin-satellite-two"><UsersRound size={22} strokeWidth={1.5}/></div>
    <span className="rb-admin-light-column"/>
    <span className="rb-admin-exit-ripple"/>
  </div>;
}
