import { createPortal } from 'react-dom';
import { JarvisAvatar } from './jarvis-avatar';
import './jarvis-opening.css';

/** Decorative opening only; no audio, microphone, or account action. */
export function JarvisOpening({ onStop }: { onStop: () => void }) {
  return createPortal(<div className="rb-jarvis-opening" role="dialog" aria-modal="true" aria-label="Jarvis opening animation" data-testid="jarvis-opening" onKeyDown={event => {
    if (event.key === 'Tab') { event.preventDefault(); event.currentTarget.querySelector('button')?.focus(); }
  }}>
    <div className="rb-jarvis-reveal-content">
      <div className="rb-jarvis-scene" aria-hidden="true">
        <span className="rb-jarvis-aura"/>
        <span className="rb-jarvis-orbit"/><span className="rb-jarvis-orbit alternate"/>
        <span className="rb-jarvis-card-depth"/>
        <div className="rb-jarvis-card">
          <JarvisAvatar className="rb-jarvis-logo"/>
          <span className="rb-jarvis-card-shine"/>
        </div>
        <div className="rb-jarvis-bubble rb-jarvis-bubble-left"><i/><i/><i/></div>
        <div className="rb-jarvis-bubble rb-jarvis-bubble-right"><span/><span/></div>
        <span className="rb-jarvis-platform"/>
      </div>
      <p className="rb-jarvis-reveal-label">JARVIS</p>
      <button autoFocus type="button" className="rb-jarvis-stop" onClick={onStop} data-testid="button-stop-jarvis-opening">Stop Animation · Open chat</button>
    </div>
  </div>, document.body);
}
