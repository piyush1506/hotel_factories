import './tailwind.css';

export const metadata = {
  title: 'Hotel Factories — Luxury Hotels, Heritage Palaces & Coastal Resorts',
  description: 'Discover and book handcrafted luxury hotels, heritage retreats, beachfront villas, and boutique stays across India with Hotel Factories. Guaranteed best rates, instant confirmation & 24/7 concierge.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/apple-icon.png'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Modern Luxury Typography from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* FontAwesome 6 Pro/Free Icons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
