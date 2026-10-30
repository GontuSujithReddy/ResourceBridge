import type { CSSProperties } from 'react';
import './profile-exit-effects.css';

/** Decorative glass and light only; not an identity-verification result. */
export function ProfileExitEffects() {
  return <div className="rb-identity-fx" aria-hidden="true">
    <span className="rb-identity-gyro rb-identity-gyro-one"/>
    <span className="rb-identity-gyro rb-identity-gyro-two"/>
    <span className="rb-identity-gyro rb-identity-gyro-three"/>
    {Array.from({ length: 12 }, (_, index) => <span
      key={index}
      className="rb-identity-prism"
      style={{
        '--prism-angle': `${index * 30}deg`,
        '--prism-radius': `${88 + (index % 3) * 12}px`,
        '--prism-depth': `${(index % 3 - 1) * 30}px`,
      } as CSSProperties}
    />)}
    <span className="rb-identity-lens"/>
  </div>;
}
