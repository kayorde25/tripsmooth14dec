# Design Guidelines: Trip.com-Inspired Flight Booking Platform

## Design Approach
**Reference-Based Strategy**: Drawing from Trip.com, Booking.com, and Airbnb's booking flows. This e-commerce travel experience requires high trust signals, clear information hierarchy, and streamlined conversion paths.

## Typography System

**Font Stack**: 
- Primary: Inter or DM Sans (clean, modern, excellent readability for data)
- Accent: Space Grotesk for hero headlines (optional premium touch)

**Hierarchy**:
- Hero Headlines: text-4xl to text-6xl, font-bold
- Section Titles: text-3xl, font-semibold
- Card Headings: text-xl, font-semibold
- Body Text: text-base, font-normal
- Flight Details/Times: text-lg, font-medium (emphasized for scannability)
- Price Display: text-2xl to text-3xl, font-bold
- Metadata/Labels: text-sm, font-medium
- Fine Print (policies): text-xs to text-sm

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 24 for consistent rhythm
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16, py-24
- Grid gaps: gap-4, gap-6, gap-8
- Form field spacing: space-y-4, space-y-6

**Container Strategy**:
- Max widths: max-w-7xl for main content, max-w-4xl for forms
- Search bar: max-w-6xl centered
- Checkout flow: max-w-3xl for focused conversion

## Core Components

### 1. Hero Section (Homepage)
- Height: 60vh to 80vh with engaging travel imagery
- Full-width background image of popular destination
- Centered search form overlay with backdrop-blur-md background
- Search form includes: trip type selector, origin/destination fields, date pickers, passenger dropdown, cabin class
- CTA: Large "Search Flights" button below form

### 2. Flight Search Form
- Horizontal layout on desktop (grid-cols-4 to grid-cols-5)
- Prominent input fields with icons (Heroicons for plane, calendar, user)
- Date picker integration with range selection
- Passenger selector with increment/decrement controls for adults/children/infants
- Filters toggle button ("Direct flights only" checkbox)

### 3. Flight Results Cards
- Grid layout: Single column stack on mobile, can use 1.5-column layout on very wide screens for sidebar filters
- Each card: Airline logo (64px), departure/arrival times (large, prominent), duration, stops indicator, price (right-aligned, bold)
- Expandable details on click: baggage info, layover details, fare conditions
- Filter sidebar: Checkboxes for airlines, price range slider, stops filter, baggage inclusion
- Sort options: Price, Duration, Departure/Arrival time

### 4. Fare Selection Interface
- Side-by-side comparison cards (grid-cols-2 or grid-cols-3)
- Each fare type shows: Baggage allowance with icon, change fee, cancellation policy
- Visual differentiation for "Recommended" option with subtle border treatment
- Clear "Select" button per fare option

### 5. Passenger Information Form
- Single-column form layout (max-w-2xl)
- Grouped fields per passenger with clear visual separation (border-l-4 accent)
- Input fields: Full name split (First/Last), Gender dropdown, DOB date picker, Nationality dropdown, Passport number, Expiration date
- Repeat pattern for multiple passengers with collapsible sections
- Contact details section: Email, phone with country code selector

### 6. Seat Selection Interface
- Full-width airplane seat map visualization
- Grid representing seat layout (use CSS Grid for perfect alignment)
- Seat states: Available (outlined), Selected (filled), Occupied (disabled), Premium (gold accent)
- Legend explaining seat types and pricing
- Dual-pane layout: Seat map (left, 2/3 width) + Summary panel (right, 1/3 width)
- Price tags on premium seats (extra legroom, exit rows)

### 7. Payment & Checkout
- Linear vertical flow (no multi-column for payment section)
- Booking summary card: Flight details, passenger count, total breakdown
- Payment method selector: Radio buttons with credit card, PayPal icons
- Secure form fields for card details with proper spacing
- Total price prominently displayed with "Complete Booking" CTA
- Trust signals: Security badge, cancellation policy reminder

### 8. Multi-Step Progress Indicator
- Fixed top bar or breadcrumb: Search → Select → Details → Seats → Payment
- Active step highlighted, completed steps with checkmark, upcoming steps muted

## Form & Input Patterns

- Input fields: h-12, rounded-lg, border with focus ring
- Labels: text-sm, font-medium above inputs
- Dropdowns: Custom styled with chevron icon
- Date pickers: Calendar overlay with range selection highlighting
- Error states: Red accent with icon and message below field
- Required field indicator: Asterisk in label

## Navigation & Header

- Sticky header: Logo (left), Main nav links (Flights, Hotels, Cars), User account/login (right)
- Height: h-16 to h-20
- Search header variation: Condensed search bar for results/booking pages

## Responsive Behavior

- Mobile: Single column, full-width components, collapsible filters in drawer
- Tablet: 2-column grids where appropriate, side-by-side fare cards
- Desktop: Full multi-column layouts, persistent filter sidebar

## Images

**Hero Image**: Large, inspiring travel destination image (beach, cityscape, or iconic landmark) at 1920x1080, positioned with object-cover. Overlay gradient for text readability.

**Airline Logos**: 64x64px in flight cards, 48x48px in compact views

**Seat Map**: SVG-based grid representation, no photographic images needed

**Trust Badges**: Payment method icons (Visa, Mastercard, PayPal) at 40px height in footer/payment section

## Icons
Use Heroicons throughout: airplane, calendar, user-group, map-pin, credit-card, check-circle, x-circle, information-circle

## Animation Approach
Minimal animations:
- Smooth transitions on card hover (subtle shadow increase)
- Slide-in for mobile filter drawer
- Fade transitions between booking steps
- No parallax or scroll-triggered effects