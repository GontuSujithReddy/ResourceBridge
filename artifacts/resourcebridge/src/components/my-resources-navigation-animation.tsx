import type { CSSProperties } from 'react';
import { BookOpen, Camera, Drill, Layers3 } from 'lucide-react';
import './my-resources-navigation-animation.css';

/** Decorative navigation feedback, not a change to the user's listings. */
export function MyResourcesNavigationAnimation() {
  const tiles = [
    { Icon: BookOpen, x: '-104px', y: '-105px', turn: '-18deg', tone: 'teal' },
    { Icon: Drill, x: '0px', y: '-150px', turn: '8deg', tone: 'blue' },
    { Icon: Camera, x: '104px', y: '-92px', turn: '20deg', tone: 'amber' },
  ];
  return <div className="rb-resources-motion" aria-hidden="true">
    <div className="rb-resources-stage">
      <span className="rb-resources-glow"/>
      <span className="rb-resources-floor"/>
      <span className="rb-resources-ring"/>
      <span className="rb-resources-ring rb-resources-ring-inner"/>
      <div className="rb-resources-vault">
        <span className="rb-resources-vault-back"/>
        <span className="rb-resources-vault-light"/>
        {tiles.map(({ Icon, x, y, turn, tone }, index) =>
          <div key={tone} className={`rb-resources-tile rb-resources-tile-${tone}`}
            style={{ '--tile-x': x, '--tile-y': y, '--tile-turn': turn, '--tile-delay': `${index * 65}ms` } as CSSProperties}>
            <Icon size={34} strokeWidth={1.7}/>
            <span className="rb-resources-tile-glint"/>
          </div>,
        )}
        <div className="rb-resources-vault-front">
          <span className="rb-resources-vault-seam"/>
          <Layers3 size={36} strokeWidth={1.5}/>
          <span className="rb-resources-vault-dots"><i/><i/><i/></span>
        </div>
        <span className="rb-resources-vault-side"/>
        <span className="rb-resources-vault-lid"/>
      </div>
      {Array.from({ length: 8 }, (_, index) =>
        <span className="rb-resources-mote" key={index}
          style={{ '--mote-angle': `${index * 45}deg`, '--mote-delay': `${index * 40}ms` } as CSSProperties}/>,
      )}
    </div>
  </div>;
}
