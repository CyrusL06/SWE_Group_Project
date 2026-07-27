import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import Button from '../components/Button'
import Header from '../components/Header'

function getReservationUrl() {
  if (typeof window === 'undefined') return '/qr'
  return `${window.location.origin}/qr`
}

export default function QrCodePage() {
  const [qrImage, setQrImage] = useState('')
  const [reservationUrl] = useState(getReservationUrl)

  useEffect(() => {
    QRCode.toDataURL(reservationUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 8,
      width: 280,
    }).then(setQrImage).catch(() => setQrImage(''))
  }, [reservationUrl])

  return (
    <div className="reservation-page">
      <Header minimal />

      <main className="qr-main">
        <section className="qr-card" aria-labelledby="qr-title">
          <div className="qr-copy">
            <p className="reservation-context">QR code entry</p>
            <h1 id="qr-title">Scan to reserve a bike</h1>
            <p>Customers scan this code at the shop and land directly on the customer reservation form. For this local demo, the QR points to the running Vite app.</p>
          </div>

          <div className="qr-frame" aria-label={`QR code for ${reservationUrl}`}>
            {qrImage ? <img alt="QR code to open the bike reservation form" src={qrImage} /> : <span>Generating QR...</span>}
          </div>

          <div className="qr-url-box">
            <span>QR target</span>
            <code>{reservationUrl}</code>
          </div>

          <div className="qr-actions">
            <Button href="/qr">Open reservation form</Button>
            <Button href="/reserve" variant="secondary">Reserve page</Button>
          </div>
        </section>
      </main>
    </div>
  )
}
