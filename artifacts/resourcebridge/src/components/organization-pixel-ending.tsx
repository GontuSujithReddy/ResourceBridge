import type { CSSProperties } from 'react';
import './organization-pixel-ending.css';

// Deterministic fragments follow the cube, satellite tiles, and network rings.
// Keep this ending separate so removing it restores the original reveal.
const fragments = Array.from({ length: 26 * 26 }, (_, index) => {
  const column = index % 26;
  const row = Math.floor(index / 26);
  const x = column * 10 + 5;
  const y = row * 10 + 5;
  const dx = Math.abs(x - 130);
  const dy = Math.abs(y - 125);
  const core = dx < 48 && dy < 48 && dx + dy < 72;
  const satellite = [
    [23, 39], [191, 39], [21, 169], [194, 169],
  ].some(([left, top]) => x >= left && x <= left + 45 && y >= top && y <= top + 45);
  const orbit = Math.abs(Math.hypot(x - 130, y - 130) - 99) < 4
    || Math.abs(((x - 130) / 111) ** 2 + ((y - 130) / 49) ** 2 - 1) < .1;
  if (!core && !satellite && !orbit) return null;
  const shades = core
    ? ['#3b70bb', '#568eda', '#7db0eb', '#3561a7']
    : satellite ? ['#c1d9f1', '#e6f2ff', '#93b8de', '#b3d0ed']
      : ['#78a8da', '#a6cbed', '#93b9df', '#6897cb'];
  return {
    index,
    style: {
      left: column * 10 + 1,
      top: row * 10 + 1,
      width: orbit && !core && !satellite ? 5 : 8,
      height: orbit && !core && !satellite ? 5 : 8,
      backgroundColor: shades[(row + column * 3) % shades.length],
      '--pixel-row': row,
      '--pixel-drift': `${((index * 17) % 77) - 38}px`,
      '--pixel-fall': `${95 + ((index * 11) % 72)}px`,
      '--pixel-spin': `${((index * 31) % 240) - 120}deg`,
    } as CSSProperties,
  };
}).filter(fragment => fragment !== null);

export function OrganizationPixelEnding() {
  return <div className="rb-org-pixel-fragments" aria-hidden="true">
    {fragments.map(fragment => <i key={fragment.index} style={fragment.style}/>)}
  </div>;
}
