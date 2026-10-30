import { useId, useState } from 'react';

const STAR = 'M50 10 L61.2 36.4 L89.9 38.9 L68.2 57.7 L74.7 85.6 L50 70.8 L25.3 85.6 L31.8 57.7 L10.1 38.9 L38.8 36.4 Z';
// Facets: each arm split into a lit and shaded half, meeting at center (50,52)
const FACETS_LIGHT = ['M50 10 L50 52 L38.8 36.4Z', 'M89.9 38.9 L50 52 L61.2 36.4Z', 'M74.7 85.6 L50 52 L68.2 57.7Z', 'M25.3 85.6 L50 52 L50 70.8Z', 'M10.1 38.9 L50 52 L31.8 57.7Z'];
const FACETS_DARK = ['M50 10 L50 52 L61.2 36.4Z', 'M89.9 38.9 L50 52 L68.2 57.7Z', 'M74.7 85.6 L50 52 L50 70.8Z', 'M25.3 85.6 L50 52 L31.8 57.7Z', 'M10.1 38.9 L50 52 L38.8 36.4Z'];

export function RatingStarAnimation() {
  const id = useId();
  const goldId = `${id}-gold`;
  const edgeId = `${id}-edge`;
  const sheenId = `${id}-sheen`;
  const clipId = `${id}-clip`;
  const [paused, setPaused] = useState(() => window.localStorage.getItem('resourcebridge:rating-star-paused') === 'true');
  function toggleBlink() {
    const next = !paused;
    setPaused(next);
    window.localStorage.setItem('resourcebridge:rating-star-paused', String(next));
  }
  return (
    <button type="button" className="rb-rating-star-control" data-paused={paused} onClick={toggleBlink} aria-label={paused ? 'Gold star animation paused. Resume animation' : 'Gold star animation playing. Pause animation'} aria-pressed={!paused} title={paused ? 'Resume star animation' : 'Pause star animation'} data-testid="button-rating-star-toggle">
      <span className="rb-star3d-stage" aria-hidden="true">
        <span className="rb-star3d-halo" />
        <svg className="rb-rating-star rb-star3d" viewBox="0 0 100 100" aria-hidden="true" focusable="false" data-testid="animation-rating-star">
          <defs>
            <linearGradient id={goldId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff3b0" />
              <stop offset=".35" stopColor="#ffd23a" />
              <stop offset=".75" stopColor="#f0a400" />
              <stop offset="1" stopColor="#b86e00" />
            </linearGradient>
            <linearGradient id={edgeId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c98200" />
              <stop offset="1" stopColor="#7a4300" />
            </linearGradient>
            <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset=".5" stopColor="#fffbe6" stopOpacity=".95" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id={clipId}><path d={STAR} /></clipPath>
          </defs>
          <g className="rb-star3d-body">
            <path d={STAR} transform="translate(1.6 3.2)" fill={`url(#${edgeId})`} />
            <path className="rb-star-core" d={STAR} fill={`url(#${goldId})`} stroke="#8a5200" strokeWidth="2.2" strokeLinejoin="round" />
            {FACETS_LIGHT.map((d) => <path key={d} d={d} fill="#fff6c8" opacity=".38" />)}
            {FACETS_DARK.map((d) => <path key={d} d={d} fill="#a35f00" opacity=".22" />)}
            <g clipPath={`url(#${clipId})`}>
              <rect className="rb-star3d-sheen" x="-30" y="-10" width="22" height="130" fill={`url(#${sheenId})`} transform="rotate(20 50 50)" />
            </g>
            <ellipse cx="41" cy="33" rx="5" ry="2.4" fill="#fffdf0" opacity=".85" transform="rotate(-30 41 33)" />
          </g>
          <g className="rb-star-rays" fill="#fff6c4" stroke="#e9a900" strokeWidth=".8">
            <path className="rb-star3d-spark rb-star3d-spark-a" d="M86 14 L88 20 L94 22 L88 24 L86 30 L84 24 L78 22 L84 20Z" />
            <path className="rb-star3d-spark rb-star3d-spark-b" d="M14 66 L15.5 70.5 L20 72 L15.5 73.5 L14 78 L12.5 73.5 L8 72 L12.5 70.5Z" />
            <path className="rb-star3d-spark rb-star3d-spark-c" d="M80 78 L81 81 L84 82 L81 83 L80 86 L79 83 L76 82 L79 81Z" />
          </g>
        </svg>
      </span>
    </button>
  );
}
