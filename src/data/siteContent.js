export const metrics = [
  ['98%', 'dock uptime across active stations'],
  ['4.2k', 'rides coordinated every weekday'],
  ['18 min', 'average maintenance response window'],
]

export const featureCards = [
  {
    badge: 'Fleet visibility',
    title: 'Know where every bike should be before demand peaks.',
    items: [
      { title: 'Station health at a glance', desc: 'Track live inventory, dock capacity, low-battery assets, and service exceptions in one control surface.' },
      { title: 'Demand-aware balancing', desc: 'Spot tomorrow morning shortages early with commute-pattern forecasting and weather-aware suggestions.' },
      { title: 'Operator-ready alerts', desc: 'Turn noisy telemetry into clear dispatch queues for field teams and depot managers.' },
    ],
    visual: 'map',
  },
  {
    badge: 'Rider experience',
    title: 'Make every rental feel predictable, even during rush hour.',
    items: [
      { title: 'Reliable availability', desc: 'Show riders nearby bikes, e-bike range, and dock-return certainty before they start a trip.' },
      { title: 'Faster issue resolution', desc: 'Capture damaged-bike reports and route them directly into the right maintenance queue.' },
      { title: 'Membership-ready flows', desc: 'Support campus, city, and corporate passes without confusing checkout steps.' },
    ],
    visual: 'phone',
    reverse: true,
  },
  {
    badge: 'Maintenance intelligence',
    title: 'Prioritize work by rider impact, not by inbox order.',
    items: [
      { title: 'Predictive service lists', desc: 'Combine mileage, battery cycles, fault codes, and rider reports into a ranked repair plan.' },
      { title: 'Depot coordination', desc: 'Give technicians route-ready batches with parts, location, and service history attached.' },
      { title: 'Audit-friendly reporting', desc: 'Export service records, SLA history, and city contract metrics without spreadsheet cleanup.' },
    ],
    visual: 'workshop',
  },
]

export const processSteps = [
  ['01', 'Connect fleet data', 'Bring in stations, bikes, trips, battery telemetry, and rider support events.'],
  ['02', 'Set operating rules', 'Define zones, service SLAs, redistribution targets, and membership policies.'],
  ['03', 'Dispatch with confidence', 'Give operators and field teams the same live priorities every shift.'],
]

export const footerLinks = [
  ['Platform', [['Fleet visibility', '#features'], ['Operations', '#operations'], ['Demo', '#demo']]],
  ['Company', [['Sign in', '/login'], ['Contact', 'mailto:support@commutetrack.io'], ['Privacy', '/privacy-policy']]],
]

export const footerHighlights = [
  ['Live availability', 'Track docks, bikes, and battery readiness in real time.'],
  ['Service planning', 'Prioritize repairs by rider impact and SLA commitments.'],
  ['Partner reporting', 'Share city, campus, and employer performance metrics quickly.'],
]
