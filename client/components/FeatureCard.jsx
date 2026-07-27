function FeatureVisual({ type }) {
  return (
    <div className={`feature-visual feature-visual-${type}`} aria-hidden="true">
      <div className="route-line route-line-a" />
      <div className="route-line route-line-b" />
      <div className="station station-one">12</div>
      <div className="station station-two">07</div>
      <div className="station station-three">24</div>

      <div className="mini-panel">
        <span>{type === 'phone' ? 'Dock 4B' : type === 'workshop' ? 'Service bay' : 'North loop'}</span>
        <strong>{type === 'phone' ? 'Bike ready' : type === 'workshop' ? '8 priority tasks' : 'Balanced'}</strong>
      </div>
    </div>
  )
}

export default function FeatureCard({ badge, title, items, visual, reverse }) {
  const content = (
    <div className="feature-card-content">
      <div className="badge">{badge}</div>
      <h3>{title}</h3>

      <ul className="feature-list">
        {items.map((item) => (
          <li key={item.title}>
            <div className="feat-title">{item.title}</div>
            <div className="feat-desc">{item.desc}</div>
          </li>
        ))}
      </ul>
    </div>
  )

  const visualElement = <FeatureVisual type={visual} />

  return (
    <article className="feature-card">
      {reverse ? visualElement : content}
      {reverse ? content : visualElement}
    </article>
  )
}
