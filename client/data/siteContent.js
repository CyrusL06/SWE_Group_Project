export const metrics = [
  ['Today', 'reservations visible on one staff board'],
  ['Live', 'bike availability by type before check-in'],
  ['QR', 'customer booking from the shop or online'],
]

export const featureCards = [
  {
    badge: 'Customer reservations',
    title: 'Let riders reserve a bike before they arrive.',
    items: [
      { title: 'Quick booking form', desc: 'Customers enter their name, phone number, bike type, rental duration, and agreement confirmation.' },
      { title: 'QR code entry', desc: 'The same form works from an in-shop QR code, so walk-up customers can book on their own phone.' },
      { title: 'Availability protection', desc: 'Confirmed reservations hold the requested bike type so staff do not accidentally rent it twice.' },
    ],
    visual: 'phone',
  },
  {
    badge: 'Staff daily board',
    title: 'Give clerks one clear place to run the rental day.',
    items: [
      { title: 'Search by customer', desc: 'Staff can look up reservations by name or phone number when a customer arrives.' },
      { title: 'Availability by bike type', desc: 'City, electric, and cargo bike counts stay visible before staff starts a reservation or walk-in rental.' },
      { title: 'Check-in flow', desc: 'Reserved customers can be confirmed, assigned, and marked active without digging through spreadsheets.' },
    ],
    visual: 'map',
    reverse: true,
  },
  {
    badge: 'Rental status control',
    title: 'Track every rental from confirmed to returned.',
    items: [
      { title: 'Walk-in rentals', desc: 'If bikes are available, staff can enter customer details and start an active rental immediately.' },
      { title: 'Returns and cancellations', desc: 'Staff can mark bikes returned or cancel reservations so inventory becomes available again.' },
      { title: 'Late rental visibility', desc: 'Overdue rentals are highlighted so staff know who to contact and what bikes are still out.' },
    ],
    visual: 'workshop',
  },
]

export const processSteps = [
  ['01', 'Customer books', 'A rider reserves online or scans the shop QR code, chooses a bike type and duration, then confirms the agreement.'],
  ['02', 'Staff checks in', 'The clerk searches the daily board, confirms the reservation or creates a walk-in, and starts the rental.'],
  ['03', 'Bike returns', 'Staff records the return, updates the rental status, and the bike becomes available for the next customer.'],
]

export const footerLinks = [
  ['Rental system', [['Reserve a bike', '/reserve'], ['QR booking', '/qr-code'], ['Staff board', '/staff']]],
  ['Project scope', [['Staff sign in', '/login'], ['No payments', '#features'], ['Daily operations', '#operations']]],
]

export const footerHighlights = [
  ['Reservations', 'Customers reserve a bike type before arrival and reduce wait time at the shop.'],
  ['Staff operations', 'Clerks manage check-ins, walk-ins, cancellations, returns, and late rentals from one board.'],
  ['Availability', 'Bike counts stay tied to reservation and rental status so double-booking is avoided.'],
]
