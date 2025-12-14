# TripSmooth Flight Booking Platform

## Overview

TripSmooth is a comprehensive flight booking platform inspired by Trip.com, designed to provide users with a seamless experience for searching, comparing, and booking flights worldwide with a focus on African routes. The application features a modern, trust-building interface with clear information hierarchy, comprehensive flight search capabilities, multi-step booking flow, and integrated payment processing via PayPal.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing (Home, Flights, Booking pages)

**UI Component Strategy**
- Shadcn/ui component library (New York style variant) with Radix UI primitives for accessible, headless components
- Tailwind CSS for utility-first styling with custom design tokens
- Component organization: `/components` for shared UI, `/components/ui` for shadcn primitives, `/pages` for route components
- Design system follows Trip.com-inspired patterns with emphasis on trust signals and data hierarchy

**State Management**
- TanStack Query (React Query) for server state management, caching, and data synchronization
- Local React state for UI interactions and form management
- LocalStorage for temporary flight selection data during booking flow

**Key User Flows**
- Homepage with hero section and flight search form
- Flight results page with filtering, sorting, and flight comparison
- Multi-step booking process: Fare Selection → Passenger Details → Seat Selection → Add-Ons → Checkout Review → Payment → Confirmation
- Progressive disclosure pattern with collapsible sections to reduce cognitive load
- Manage Booking portal with post-booking actions (Cancel, Change Flight, Add Baggage, Change Seat)

**Promo Codes**
- SAVE10: 10% off booking
- TRIP10: 10% off booking
- SAVE50: $50 off booking
- WELCOME15: 15% off for new customers
- AFRICA25: $25 off African routes

### Backend Architecture

**Server Framework**
- Express.js running on Node.js with TypeScript
- HTTP server creation via Node's built-in `http` module
- Development mode uses Vite middleware for SSR-style HTML serving

**API Design**
- RESTful API endpoints under `/api` prefix
- Routes organized in `/server/routes.ts` with controller-like structure
- Key endpoints:
  - `/api/airports` - Airport data retrieval
  - `/api/airlines` - Airline information
  - `/api/flights/search` - Flight search with filtering
  - `/api/bookings` - Booking creation and management
  - `/paypal/*` - PayPal payment integration

**Data Access Layer**
- Storage abstraction interface (`IStorage`) in `/server/storage.ts`
- Separates business logic from data persistence implementation
- Supports flight search, booking management, seat assignments, and user operations

**Schema Validation**
- Zod for runtime type validation on API inputs
- Drizzle-Zod integration for database schema validation
- Shared schema definitions in `/shared/schema.ts` for type safety across client and server

### Data Storage

**Storage Implementation**
- In-memory storage for development and demo purposes
- MemStorage class in `/server/storage.ts` implementing IStorage interface
- Pre-seeded with sample flights, airports, airlines, and fare types

**Data Models**
- Flights: airline, times, duration, stops, pricing, baggage policies
- Bookings: reference, flight ID, fare type, status, contact info
- Passengers: personal details, travel documents
- Seats: row/column, type (standard/premium/exit), price, occupancy
- FareTypes: Light (base), Standard (+15%), Flex (+35%) with different policies

**Key Features**
- Automatic seat generation for each flight (15 rows x 6 columns)
- Booking reference generation (TS-XXXXXX format)
- Real-time seat availability tracking

### External Dependencies

**Amadeus Enterprise REST API Integration**
- Full integration with Amadeus Travel API for real flight data
- OAuth2 authentication with token caching for efficiency
- Flight Offers Search (POST /v2/shopping/flight-offers) - Search for real flights
- Flight Offers Pricing (POST /v1/shopping/flight-offers/pricing) - Get confirmed pricing
- Flight Orders (POST /v1/booking/flight-orders) - Create flight bookings
- Order Management (GET/DELETE /v1/booking/flight-orders/:id) - Retrieve and cancel orders
- Seat Assignment (POST /v1/booking/flight-orders/:id) - Add seat selections to orders
- Traveler Updates (POST /v1/booking/flight-orders/:id) - Update passenger details and documents
- Commission Management (POST /v1/booking/flight-orders/:id) - Add agency commissions
- Required secrets: AMADEUS_API_KEY, AMADEUS_API_SECRET, AMADEUS_OFFICE_ID
- Environment variables: AMADEUS_BASE_URL, AMADEUS_GRANT_TYPE

**Hotelbeds API Integration**
- Full integration with Hotelbeds for hotel search and booking
- Three API types implemented:

1. **Booking API** (hotel-api/1.0)
   - Hotel availability search (POST /hotels)
   - Rate checking (POST /checkrates)
   - Booking creation (POST /bookings)
   - Booking management (GET/DELETE /bookings/:reference)
   - Required secrets: HOTELBEDS_API_KEY, HOTELBEDS_API_SECRET
   - Authentication: API Key + SHA256 signature

2. **Content API** (hotel-content-api/1.0)
   - Hotel details and static content (GET /hotels, /hotels/:codes/details)
   - Destinations and countries (GET /locations/destinations, /locations/countries)
   - Type lookups (accommodations, boards, categories, chains, facilities, etc.)
   - Image URL construction with 7 size variants (small/medium/standard/bigger/xl/xxl/original)
   - Base image URL: https://photos.hotelbeds.com/giata/

3. **Cache API** (Files Service)
   - Bulk data access for price comparison sites
   - Full rates download (GET /files/full)
   - Update rates since last confirmation (GET /files/update)
   - Version confirmation (GET /files/confirm with X-Version header)
   - Additional secrets required: HOTELBEDS_CACHE_USERNAME, HOTELBEDS_CACHE_PASSWORD
   - Test environment: afi2.int.hotelbeds.com
   - Live environment: afi2.hotelbeds.com
   
   **Cache File Specifications (Pipe-delimited format)**
   - [CCON] Contract Header - External/internal inventory, destination, office, contract info, hotel code, dates, currency, pricing model
   - [CNHA] Room Types - Room type code, characteristic, capacity limits, pax limits
   - [CNNH] No Hotel Contracts - Language code, hotel description
   - [CNPR] Promotions - Code, description, date ranges, application dates, inclusion status
   - [CNHF] Handling Fees - Date ranges, fee codes, rates, types (C/P/D), amounts, age limits
   - [ATAX] Tax Breakdown - Date ranges, room/board codes, tax codes, amounts, percentages, currency
   - [CNCL] Valid Markets - Country codes, validity status
   - [CNIN] Inventory - Date ranges, room type, characteristic, rate, release days, allotment
   - [CNCT] Prices - Date ranges, room details, rates, net/selling prices, board codes
   - [CNSR] Board Supplements/Discounts - Date ranges, board code, amounts, weekday applicability
   - [CNSU] Supplements/Discounts - Full supplement details with application types, amounts, date/day restrictions
   - [CNPV] Stop Sales - Date ranges, rate, room type, characteristic, board
   - [CNGR] Frees - Free night offers with application rules and day restrictions
   - [CNOE] Combinable Offers - Offer code pairs with exclusion status
   - [CNEM] Min/Max Stay - Stay duration restrictions with date and day applicability
   - [CNTA] Rate Codes - Rate code definitions with descriptions and order
   - [CNES] Check In/Out - Check in/out restrictions by date, room, rate, and day
   - [CNCF] Cancellation Fees - Fee structures by date range, amounts, percentages, application type
   
   **Parser Functions** (server/hotelbeds.ts)
   - `parseCacheFileContent(content: string)` - Parse full cache file into structured data
   - Individual parsers for each section type (parseContractHeader, parseRoomType, etc.)
   - Helper functions for boolean/number parsing from pipe-delimited format
   
   **External Inventory Process (Supplier Integration)**
   - External Suppliers: ID_B2B_15 (Hilton), ID_B2B_19 (Bonotel), ID_B2B_20 (Accor), ID_B2B_21 (HRS), ID_B2B_24 (Tradyso), ID_B2B_26 (Derbysoft)
   - [SIAP] Suppliers Integration Availability and Prices - Room availability with net/selling prices, occupancy rules, children age ranges
   - [SIIN] Supplier Integration Inventory - Release min/max days, allotment per room/date
   - [SIEM] Supplier Integration Min/Max Stay - Per check-in date or whole stay restrictions
   - [SICF] Supplier Integration Cancellation Fees - Days/hours before, charge type (E=First night, C=Day)
   
   **Conventions**
   - Date format: YYYYMMDD
   - Amount format: Decimal with "." as separator
   - Currencies: EUR (Euro), GBP (UK Pound), USD (US Dollar)
   - Folder structure: DESTINATIONS/<IATA_CODE>/<files>
   - Internal file naming: <incoming>_<contract>_<paymentModel>_<opaque> (e.g., 1_1234_M_F)
   - External file naming: <destination>_<hotelCode>_<contractName> (e.g., BCN_1233_ID_B2B_ISHBAR)
   
   **Parser Functions**
   - `parseCacheFileContent(content)` - Parse internal cache file into structured data
   - `parseExternalInventoryContent(content, fileName)` - Parse supplier integration files
   - `parseInventoryFile(content, fileName)` - Combined parser for both internal and external structures
   - `parseFileName(fileName)` - Auto-detect internal vs external file format
   - `parseInternalFileName(fileName)` - Parse internal file naming pattern
   - `parseExternalFileName(fileName)` - Parse external file naming pattern
   - `parseCacheDate(dateStr)` - Parse YYYYMMDD date format
   - `parseCacheAmount(amountStr)` - Parse decimal amount with "." separator
   - `canSumPricesForLengthOfStay(isTotalPricePerStay, nights, lengths)` - Price calculation helper

4. **Certification Process** (hotel-api/certification)
   
   **Workflow Requirements**
   - Three-step flow: Availability → CheckRate (if RECHECK) → Booking
   - Max 2000 hotels per availability call
   - Max 10 rates per CheckRate call
   - All rooms must be in same availability call
   - CheckRate only required when rateType="RECHECK"
   - Booking confirmation timeout: 60 seconds
   
   **Rate Types**
   - BOOKABLE: Can book directly without CheckRate
   - RECHECK: Requires CheckRate call before booking
   
   **Source Markets** (for pricing)
   - GB (UK), US, ES (Spain), DE (Germany), FR, IT, PT, NL, BE, CH, AU, BR, MX, CA, AE, SA
   
   **Voucher Requirements**
   - Hotel info: name (mandatory), category, address (mandatory), destination, phone
   - Passenger info: holder name/surname, paxes with ages for children
   - Booking info: check-in/out dates, room type, board type, rate comments
   - Payment info: "Payable through XXX (supplier), VAT: YYY, Ref: ZZZ"
   
   **Certification Functions**
   - `getCertificationChecklist()` - Full checklist with 30+ requirements
   - `getCertificationStatus()` - Summary with implementation counts
   - `validateHotelCount(hotelCodes)` - Validate against 2000 limit
   - `validateRateCount(rateKeys)` - Validate against 10 limit
   - `requiresCheckRate(rateType)` - Check if CheckRate needed
   - `generateVoucher(booking, hotelDetails)` - Create compliant voucher
   
   **Certification API Endpoints**
   - GET /api/hotels/certification/checklist - View full checklist
   - GET /api/hotels/certification/status - Get implementation summary
   - GET /api/hotels/certification/limits - View all limits and constants
   - POST /api/hotels/certification/validate-hotels - Validate hotel count
   - POST /api/hotels/certification/validate-rates - Validate rate count
   - POST /api/hotels/certification/check-rate-type - Check if CheckRate needed
   - POST /api/hotels/bookings/:reference/voucher - Generate booking voucher
   - GET /api/hotels/source-markets - List available source markets

**Payment Processing**
- PayPal Server SDK integration for order creation and capture (optional)
- Graceful fallback when PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET not configured
- Returns 503 status with helpful message when PayPal is disabled
- Booking flow completes without PayPal for demo purposes

**Email & Communication**
- Infrastructure prepared for email confirmations (dependencies indicate future nodemailer integration)

**Image Assets**
- Static hero images served from `/attached_assets`
- Design references from Trip.com booking flow documentation

**UI Component Libraries**
- Comprehensive Radix UI suite for accessible primitives (dialogs, dropdowns, popovers, etc.)
- React Hook Form with Zod resolvers for form validation
- date-fns for date formatting and manipulation
- Lucide React for consistent iconography
- React Icons for brand icons (PayPal, Visa, Mastercard)

**Development Tools**
- Replit-specific plugins for runtime error overlay and development banner
- ESBuild for server-side bundling with selective dependency bundling
- TypeScript strict mode for maximum type safety

**Session Management**
- express-session with connect-pg-simple for PostgreSQL-backed sessions (dependency present, implementation pending)
- Infrastructure for authentication via Passport.js