import './page-loading-state.css';

export function PageLoadingState({ label = 'Loading your workspace…' }: { label?: string }) {
  return <div className="rb-page-loading" role="status" aria-live="polite" data-testid="status-page-loading">
    <div className="rb-page-loading-indicator">
      <span className="rb-page-loading-spinner" aria-hidden="true"/>
      <span>{label}</span>
    </div>
  </div>;
}
