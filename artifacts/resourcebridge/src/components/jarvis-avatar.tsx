import { useId } from 'react';
import './jarvis-avatar.css';

const logo = `${import.meta.env.BASE_URL}chatbot-logo.png`;

/** Small, decorative expressions preserve Jarvis's original purple identity. */
export function JarvisAvatar({ className = 'rb-ai-logo' }: { className?: string }) {
  const eyeClipId = `jarvis-eyes-${useId().replace(/:/g, '')}`;
  return <svg className={`rb-jarvis-avatar ${className}`} viewBox="0 0 160 122" aria-hidden="true" focusable="false" data-testid="jarvis-avatar">
    <defs>
      <clipPath id={eyeClipId}>
        <rect x="44" y="33" width="26" height="35"/>
        <rect x="92" y="33" width="26" height="35"/>
      </clipPath>
    </defs>
    <g className="rb-jarvis-breath">
      <g className="rb-jarvis-head">
        <image href={logo} width="160" height="122"/>
        <g fill="#fff">
          <rect x="44" y="33" width="26" height="35"/>
          <rect x="92" y="33" width="26" height="35"/>
        </g>
        <g className="rb-jarvis-eye-gaze">
          <g className="rb-jarvis-blinking-eyes" data-testid="jarvis-blinking-eyes">
            <g clipPath={`url(#${eyeClipId})`}>
              <image href={logo} width="160" height="122"/>
            </g>
            <g className="rb-jarvis-eye-catchlight" fill="#fff">
              <circle cx="52" cy="41" r="2"/>
              <circle cx="100" cy="41" r="2"/>
            </g>
          </g>
        </g>
        <path className="rb-jarvis-smile" d="M73 72 Q80 77 87 72" fill="none" stroke="#9742d7" strokeWidth="2.2" strokeLinecap="round"/>
      </g>
    </g>
  </svg>;
}
