export function LazyPanelFallback({
  label = 'Loading',
  title = 'Preparing panel…',
}: {
  label?: string;
  title?: string;
}) {
  return (
    <section className="panel comparison-panel">
      <div className="panel-head">
        <p className="panel-label">{label}</p>
        <h2>{title}</h2>
      </div>
    </section>
  );
}
