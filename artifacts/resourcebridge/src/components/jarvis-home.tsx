import { JarvisAvatar } from './jarvis-avatar';
import './jarvis-home.css';

/** Decorative launcher icon: a small dimensional purple house where Jarvis lives in the big window. */
export function JarvisHome({ className = '' }: { className?: string }) {
  return <span className={`rb-jh ${className}`} aria-hidden="true" data-testid="jarvis-home">
    <span className="rb-jh-float">
      <span className="rb-jh-halo"/>
      <svg className="rb-jh-art" viewBox="0 0 64 64" focusable="false">
        <defs>
          <linearGradient id="rbjh-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c99bf5"/><stop offset="1" stopColor="#8a4fd0"/>
          </linearGradient>
          <linearGradient id="rbjh-side" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7438b4"/><stop offset="1" stopColor="#4a2178"/>
          </linearGradient>
          <linearGradient id="rbjh-roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f2a6d8"/><stop offset="1" stopColor="#b9529e"/>
          </linearGradient>
          <linearGradient id="rbjh-roofside" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9a3f88"/><stop offset="1" stopColor="#6a2763"/>
          </linearGradient>
          <radialGradient id="rbjh-win" cx=".5" cy=".45" r=".65">
            <stop offset="0" stopColor="#fff6dc"/><stop offset=".6" stopColor="#ffe0a3"/><stop offset="1" stopColor="#f7b46b"/>
          </radialGradient>
          <linearGradient id="rbjh-door" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd88a"/><stop offset="1" stopColor="#f39a4c"/>
          </linearGradient>
        </defs>
        <ellipse className="rb-jh-shadow" cx="31" cy="60" rx="21" ry="2.6" fill="#2a103f" opacity=".35"/>
        {/* chimney */}
        <rect x="41" y="8" width="6" height="11" rx="1" fill="#6a2763"/>
        <rect x="40" y="6.5" width="8" height="3" rx="1" fill="#f2a6d8"/>
        {/* side wall */}
        <path d="M50 30 L58 25 L58 50 L50 57 Z" fill="url(#rbjh-side)"/>
        <path className="rb-jh-sidewin" d="M52 35 L56 32.5 L56 39 L52 41.5 Z" fill="#ffd88a"/>
        {/* front wall */}
        <path d="M8 30 L50 30 L50 57 L8 57 Z" fill="url(#rbjh-front)"/>
        <path d="M8 30 L50 30" stroke="#fff" strokeOpacity=".35" strokeWidth=".8"/>
        {/* roof side + roof */}
        <path d="M29 6 L37 2 L61 24 L52 31 Z" fill="url(#rbjh-roofside)"/>
        <path d="M29 6 L4 31.5 L53 31.5 Z" fill="url(#rbjh-roof)" stroke="#fde0f3" strokeOpacity=".6" strokeWidth=".7" strokeLinejoin="round"/>
        <path d="M13 26 L45 26 M18 21 L40 21 M23 16 L35 16" stroke="#8f3b80" strokeOpacity=".35" strokeWidth=".7"/>
        {/* door */}
        <path className="rb-jh-door" d="M39 57 L39 46 Q39 42 42.5 42 Q46 42 46 46 L46 57 Z" fill="url(#rbjh-door)"/>
        <circle cx="44.6" cy="50.5" r=".7" fill="#7a3a1c"/>
        <path className="rb-jh-doorspill" d="M38 57 L47 57 L50 61 L35 61 Z" fill="#ffd88a" opacity=".45"/>
        {/* big window frame */}
        <rect x="11" y="34" width="25" height="20" rx="3.5" fill="#3d1666"/>
        <rect className="rb-jh-window" x="12.5" y="35.5" width="22" height="17" rx="2.5" fill="url(#rbjh-win)"/>
        <rect x="10" y="53.5" width="27" height="2" rx="1" fill="#f5d4ff"/>
      </svg>
      <span className="rb-jh-robot"><JarvisAvatar className="rb-jh-avatar"/></span>
      <span className="rb-jh-door-visitor" data-testid="jarvis-door-visitor">
        <JarvisAvatar className="rb-jh-visiting-avatar"/>
        <i className="rb-jh-eye-star rb-jh-eye-star-one"/>
        <i className="rb-jh-eye-star rb-jh-eye-star-two"/>
        <i className="rb-jh-eye-star rb-jh-eye-star-three"/>
        <i className="rb-jh-eye-star rb-jh-eye-star-four"/>
      </span>
      <span className="rb-jh-greeting" data-testid="jarvis-home-greeting">Hi!</span>
      <svg className="rb-jh-over" viewBox="0 0 64 64" focusable="false">
        <path d="M14 36.5 L19 36.5 L14 42 Z" fill="#fff" opacity=".35"/>
        <g className="rb-jh-smoke" fill="#f6e7ff">
          <circle className="rb-jh-puff rb-jh-p1" cx="44" cy="4" r="1.6"/>
          <circle className="rb-jh-puff rb-jh-p2" cx="46" cy="2" r="1.1"/>
          <circle className="rb-jh-puff rb-jh-p3" cx="43" cy="1" r=".9"/>
        </g>
        <g fill="#fff6c8">
          <path className="rb-jh-spark rb-jh-s1" d="M8 12 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1z"/>
          <path className="rb-jh-spark rb-jh-s2" d="M56 10 l.7 1.6 1.6 .7 -1.6 .7 -.7 1.6 -.7 -1.6 -1.6 -.7 1.6 -.7z"/>
          <path className="rb-jh-spark rb-jh-s3" d="M3 44 l.6 1.4 1.4 .6 -1.4 .6 -.6 1.4 -.6 -1.4 -1.4 -.6 1.4 -.6z"/>
        </g>
      </svg>
    </span>
  </span>;
}
