# Design QA

- Source visual truth: `design-reference.png`
- Source pixels: 1486 x 1059, 24-bit RGB
- Intended CSS viewport: 1486 x 1059 at device scale factor 1
- Implementation route: `/`
- State: initial signed-out homepage matching design reference

## Focused Region Verification

### 1. Navigation & Hero / Search Console
- **Logo & Nav Links**: Brand logo rendered with architectural roofline accent; "Hotels" active tab has exact coral `#d84e55` indicator line underneath; "My Trips" and "Offers" styled with accurate typography; "INR ₹" and "Sign in" utility links aligned on the right.
- **Hero Section**:
  - Full-width scenic tropical beach background.
  - Heading: `"Find your perfect stay, for less"` in 800-weight dark slate typography.
  - Subtitle: `"Great hotels. Real prices. Happier trips across India."`
  - Pill badge: Green checkmark with `"Free cancellation on 800+ stays"`.
- **Search Bar Console** (`SearchBarConsole.js`):
  - Floating white card with soft drop shadow.
  - 4 clean segments: Destination (`Goa, India`), Check-in (`10 Oct 2026`), Check-out (`13 Oct 2026`), Rooms & Guests (`2 Guests, 1 Room`).
  - Red/coral CTA button (`#d84e55`) with magnifying glass and `"Search Hotels"`.
  - Popovers for destination search, date picking, and guest selection integrated smoothly.

### 2. Festive Travel Offers Strip
- Background: Soft peach/cream card (`#fff7ed` with `#fed7aa` border).
- Left: Orange square badge with `%` percent symbol + `"Festive Travel Offers"` + `"Get up to 25% off on select hotels across India"`.
- Right: Golden/amber pill button `"View Offers →"` with the traditional Diya illustration line art.

### 3. Recommended Stays in Goa
- Section Header: `"Recommended stays in Goa"` with `"View all stays in Goa →"` link in coral.
- 3 Reference Hotel Cards:
  1. **The Leaf Goa Resort**: 4.6 Excellent (1,248 reviews), Candolim, Goa • 400 m from beach, Pool, Restaurant, Beach access, Free cancellation, ₹4,999/night (strikethrough ₹7,500), Incl. taxes & fees.
  2. **Marbella Beachfront Suites**: 4.7 Excellent (892 reviews), Baga, Goa • 200 m from beach, Pool, Restaurant, Bar, Free cancellation, ₹5,499/night (strikethrough ₹8,200), Incl. taxes & fees.
  3. **Santana Beach Resort**: 4.5 Excellent (776 reviews), Calangute, Goa • 300 m from beach, Pool, Restaurant, Spa, Free cancellation, ₹4,299/night (strikethrough ₹6,800), Incl. taxes & fees.
- Wishlist heart toggle and responsive detail modal integration intact.

### 4. Popular Destinations in India
- Section Header: `"Popular destinations in India"` with `"Explore all destinations →"` link.
- 6 High-Fidelity Destination Cards in 6-column grid:
  - Goa (`1,800+ stays`)
  - Udaipur (`1,200+ stays`)
  - Manali (`950+ stays`)
  - Jaipur (`1,500+ stays`)
  - Munnar (`800+ stays`)
  - Alleppey (`600+ stays`)
- Interactivity: Clicking any destination filters stays and smoothly updates the search console.

## Final Result

final result: passed
