export default function HeroRide() {
  return (
    <div className="hero-ride" aria-hidden="true">
      <span className="ride-cloud ride-cloud-one" />
      <span className="ride-cloud ride-cloud-two" />
      <span className="ride-path" />

      <div className="bike-wrap">
        <svg className="bike-cartoon" viewBox="0 0 160 92" role="img">
          <circle className="bike-wheel" cx="42" cy="62" r="20" />
          <circle className="bike-wheel" cx="118" cy="62" r="20" />
          <path className="bike-frame" d="M42 62 66 34h26l26 28M66 34l14 28H42m38 0h38M92 34 80 62" />
          <path className="bike-handle" d="M92 34h20l8-10" />
          <path className="bike-seat" d="M59 28h24" />
          <circle className="bike-bell" cx="122" cy="23" r="5" />
          <path className="bike-rider" d="M76 25c8-10 23-4 22 8-.6 8-8 13-15 11-8-2-12-12-7-19Z" />
        </svg>
      </div>
    </div>
  )
}
