interface AmadeusToken {
  access_token: string;
  expires_at: number;
}

interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft: { code: string };
      operating?: { carrierCode: string };
      duration: string;
      id: string;
      numberOfStops: number;
      blacklistedInEU: boolean;
    }>;
  }>;
  price: {
    currency: string;
    total: string;
    base: string;
    fees: Array<{ amount: string; type: string }>;
    grandTotal: string;
  };
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
      base: string;
    };
    fareDetailsBySegment: Array<{
      segmentId: string;
      cabin: string;
      fareBasis: string;
      class: string;
      includedCheckedBags?: {
        weight?: number;
        weightUnit?: string;
        quantity?: number;
      };
    }>;
  }>;
}

interface AmadeusSearchResponse {
  meta: {
    count: number;
    links: { self: string };
  };
  data: AmadeusFlightOffer[];
  dictionaries: {
    locations: Record<string, { cityCode: string; countryCode: string }>;
    aircraft: Record<string, string>;
    currencies: Record<string, string>;
    carriers: Record<string, string>;
  };
}

let cachedToken: AmadeusToken | null = null;

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;
const AMADEUS_BASE_URL = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
const AMADEUS_GRANT_TYPE = process.env.AMADEUS_GRANT_TYPE || 'client_credentials';
const AMADEUS_OFFICE_ID = process.env.AMADEUS_OFFICE_ID;
const AMADEUS_COMPANY_CODE = process.env.AMADEUS_COMPANY_CODE;

export function isAmadeusConfigured(): boolean {
  return !!(AMADEUS_API_KEY && AMADEUS_API_SECRET);
}

function generateClientRef(): string {
  const companyCode = AMADEUS_COMPANY_CODE || 'TRIPSMOOTH';
  const timestamp = new Date().toISOString();
  return `${companyCode}-${timestamp}`;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }

  const clientRef = generateClientRef();
  
  const bodyParams: Record<string, string> = {
    grant_type: AMADEUS_GRANT_TYPE,
    client_id: AMADEUS_API_KEY!,
    client_secret: AMADEUS_API_SECRET!,
  };
  
  if (AMADEUS_OFFICE_ID) {
    bodyParams.guest_office_id = AMADEUS_OFFICE_ID;
  }

  const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'ama-client-ref': clientRef,
    },
    body: new URLSearchParams(bodyParams),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus auth error response:', error);
    throw new Error(`Amadeus authentication failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };

  console.log('Amadeus token obtained successfully');
  return cachedToken.access_token;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass?: string;
  tripType?: string;
  nonStop?: boolean;
}

export interface TransformedFlight {
  id: string;
  airline: string;
  airlineCode: string;
  airlineLogo: string;
  flightNumber: string;
  departure: {
    time: string;
    airport: string;
    city: string;
    date: string;
  };
  arrival: {
    time: string;
    airport: string;
    city: string;
  };
  duration: string;
  stops: number;
  stopDetails?: string[];
  price: number;
  currency: string;
  baggageIncluded: boolean;
  availableSeats: number;
  tags: string[];
  source: 'amadeus';
}

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;
  const hours = match[1] || '0';
  const minutes = match[2] || '0';
  return `${hours}h ${minutes}m`;
}

function formatTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

function formatDate(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return date.toISOString().split('T')[0];
}

export interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

export async function searchFlights(params: FlightSearchParams & { passengerCounts?: PassengerCounts }): Promise<TransformedFlight[]> {
  if (!isAmadeusConfigured()) {
    throw new Error('Amadeus API is not configured');
  }

  const token = await getAccessToken();
  const clientRef = generateClientRef();

  const originDestinations: Array<{
    id: string;
    originLocationCode: string;
    destinationLocationCode: string;
    departureDateTimeRange: { date: string };
  }> = [
    {
      id: '1',
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDateTimeRange: { date: params.departureDate },
    },
  ];

  if (params.returnDate && params.tripType === 'round-trip') {
    originDestinations.push({
      id: '2',
      originLocationCode: params.destination,
      destinationLocationCode: params.origin,
      departureDateTimeRange: { date: params.returnDate },
    });
  }

  const travelers: Array<{
    id: string;
    travelerType: string;
    fareOptions: string[];
    associatedAdultId?: string;
  }> = [];

  const counts = params.passengerCounts || { adults: params.passengers, children: 0, infants: 0 };
  let travelerId = 1;

  for (let i = 0; i < counts.adults; i++) {
    travelers.push({
      id: travelerId.toString(),
      travelerType: 'ADULT',
      fareOptions: ['STANDARD'],
    });
    travelerId++;
  }

  for (let i = 0; i < counts.children; i++) {
    travelers.push({
      id: travelerId.toString(),
      travelerType: 'CHILD',
      fareOptions: ['STANDARD'],
    });
    travelerId++;
  }

  for (let i = 0; i < counts.infants; i++) {
    travelers.push({
      id: travelerId.toString(),
      travelerType: 'HELD_INFANT',
      fareOptions: ['STANDARD'],
      associatedAdultId: (i + 1).toString(),
    });
    travelerId++;
  }

  const requestBody: any = {
    currencyCode: 'EUR',
    originDestinations,
    travelers,
    sources: ['GDS'],
    searchCriteria: {
      pricingOptions: {
        fareType: ['PUBLISHED'],
      },
    },
  };

  console.log('Amadeus search request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `${AMADEUS_BASE_URL}/v2/shopping/flight-offers`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ama-client-ref': clientRef,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus search error:', error);
    throw new Error(`Amadeus flight search failed: ${response.status} - ${error}`);
  }

  const data: AmadeusSearchResponse = await response.json();
  console.log(`Amadeus returned ${data.data?.length || 0} flight offers`);

  return transformFlightOffers(data);
}

function transformFlightOffers(response: AmadeusSearchResponse): TransformedFlight[] {
  const carriers = response.dictionaries?.carriers || {};
  const locations = response.dictionaries?.locations || {};

  clearFlightOfferCache();

  return response.data.map((offer, index) => {
    const offerId = `amadeus-${offer.id}`;
    cacheFlightOffer(offerId, offer);
    const firstItinerary = offer.itineraries[0];
    const segments = firstItinerary.segments;
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    const totalStops = segments.reduce((acc, seg) => acc + seg.numberOfStops, 0) + (segments.length - 1);
    
    const stopDetails: string[] = [];
    if (segments.length > 1) {
      for (let i = 0; i < segments.length - 1; i++) {
        stopDetails.push(segments[i].arrival.iataCode);
      }
    }

    const hasBaggage = offer.travelerPricings[0]?.fareDetailsBySegment[0]?.includedCheckedBags?.quantity 
      ? offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.quantity > 0
      : offer.pricingOptions.includedCheckedBagsOnly;

    const airlineCode = offer.validatingAirlineCodes[0] || firstSegment.carrierCode;
    const airlineName = carriers[airlineCode] || airlineCode;
    const airlineLogo = `https://pics.avs.io/200/200/${airlineCode}.png`;

    const departureLocation = locations[firstSegment.departure.iataCode];
    const arrivalLocation = locations[lastSegment.arrival.iataCode];

    return {
      id: `amadeus-${offer.id}`,
      airline: airlineName,
      airlineCode: airlineCode,
      airlineLogo: airlineLogo,
      flightNumber: `${firstSegment.carrierCode} ${firstSegment.number}`,
      departure: {
        time: formatTime(firstSegment.departure.at),
        airport: firstSegment.departure.iataCode,
        city: departureLocation?.cityCode || firstSegment.departure.iataCode,
        date: formatDate(firstSegment.departure.at),
      },
      arrival: {
        time: formatTime(lastSegment.arrival.at),
        airport: lastSegment.arrival.iataCode,
        city: arrivalLocation?.cityCode || lastSegment.arrival.iataCode,
      },
      duration: formatDuration(firstItinerary.duration),
      stops: totalStops,
      stopDetails: stopDetails.length > 0 ? stopDetails : undefined,
      price: parseFloat(offer.price.grandTotal),
      currency: offer.price.currency,
      baggageIncluded: hasBaggage,
      availableSeats: offer.numberOfBookableSeats,
      tags: [],
      source: 'amadeus' as const,
    };
  });
}

export function addFlightTags(flights: TransformedFlight[]): TransformedFlight[] {
  if (flights.length === 0) return flights;

  const sortedByPrice = [...flights].sort((a, b) => a.price - b.price);
  const cheapestId = sortedByPrice[0]?.id;

  const sortedByDuration = [...flights].sort((a, b) => {
    const durationA = parseDuration(a.duration);
    const durationB = parseDuration(b.duration);
    return durationA - durationB;
  });
  const fastestId = sortedByDuration[0]?.id;

  return flights.map(flight => {
    const tags: string[] = [];
    if (flight.id === cheapestId) {
      tags.push('Cheapest');
    }
    if (flight.id === fastestId && flight.id !== cheapestId) {
      tags.push('Fastest');
    }
    if (tags.length === 0 && flight.baggageIncluded && flight.stops === 0) {
      tags.push('Best Value');
    }
    return { ...flight, tags };
  });
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)h\s*(\d+)?m?/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  return hours * 60 + minutes;
}

// ============================================
// Flight Offers Pricing API
// ============================================

export interface PricingResult {
  flightOffers: AmadeusFlightOffer[];
  payments?: Array<{
    brand: string;
    flightOfferIds: number[];
  }>;
}

export async function priceFlightOffer(flightOffer: any, paymentBrand?: string): Promise<PricingResult> {
  if (!isAmadeusConfigured()) {
    throw new Error('Amadeus API is not configured');
  }

  const token = await getAccessToken();
  const clientRef = generateClientRef();

  const requestBody: any = {
    data: {
      type: 'flight-offers-pricing',
      flightOffers: [flightOffer],
    },
  };

  if (paymentBrand) {
    requestBody.data.payments = [
      {
        brand: paymentBrand,
        flightOfferIds: [1],
      },
    ];
  }

  console.log('Amadeus pricing request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `${AMADEUS_BASE_URL}/v1/shopping/flight-offers/pricing`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ama-client-ref': clientRef,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus pricing error:', error);
    throw new Error(`Amadeus pricing failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('Amadeus pricing response received');

  return {
    flightOffers: data.data?.flightOffers || [],
    payments: data.data?.payments,
  };
}

// ============================================
// Flight Create Order API
// ============================================

export interface TravelerInfo {
  id: string;
  dateOfBirth: string;
  name: {
    firstName: string;
    lastName: string;
  };
  gender: 'MALE' | 'FEMALE';
  contact: {
    emailAddress: string;
    phones: Array<{
      deviceType: 'MOBILE' | 'LANDLINE';
      countryCallingCode: string;
      number: string;
    }>;
  };
  documents?: Array<{
    documentType: 'PASSPORT' | 'IDENTITY_CARD';
    birthPlace?: string;
    issuanceLocation?: string;
    issuanceDate?: string;
    number: string;
    expiryDate: string;
    issuanceCountry: string;
    validityCountry?: string;
    nationality: string;
    holder: boolean;
  }>;
}

export interface CreateOrderParams {
  flightOffer: any;
  travelers: TravelerInfo[];
  remarks?: {
    general?: Array<{ subType: string; text: string }>;
  };
  ticketingAgreement?: {
    option: 'DELAY_TO_QUEUE' | 'CONFIRM';
    dateTime?: string;
  };
  contacts?: Array<{
    addresseeName: { firstName: string; lastName: string };
    companyName?: string;
    purpose: 'STANDARD' | 'INVOICE' | 'STANDARD_WITHOUT_TRANSMISSION';
    phones?: Array<{
      deviceType: 'MOBILE' | 'LANDLINE' | 'FAX';
      countryCallingCode: string;
      number: string;
    }>;
    emailAddress?: string;
    address?: {
      lines: string[];
      postalCode: string;
      cityName: string;
      countryCode: string;
    };
  }>;
}

export interface FlightOrderResult {
  id: string;
  type: string;
  queuingOfficeId?: string;
  associatedRecords?: Array<{
    reference: string;
    creationDate: string;
    originSystemCode: string;
    flightOfferId: string;
  }>;
  flightOffers: any[];
  travelers: any[];
  ticketingAgreement?: any;
}

export async function createFlightOrder(params: CreateOrderParams): Promise<FlightOrderResult> {
  if (!isAmadeusConfigured()) {
    throw new Error('Amadeus API is not configured');
  }

  const token = await getAccessToken();
  const clientRef = generateClientRef();

  const requestBody = {
    data: {
      type: 'flight-order',
      flightOffers: [params.flightOffer],
      travelers: params.travelers,
      remarks: params.remarks,
      ticketingAgreement: params.ticketingAgreement || {
        option: 'DELAY_TO_QUEUE',
        delay: '1D',
      },
      contacts: params.contacts,
    },
  };

  console.log('Amadeus create order request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `${AMADEUS_BASE_URL}/v1/booking/flight-orders`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ama-client-ref': clientRef,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus create order error:', error);
    throw new Error(`Amadeus order creation failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('Amadeus order created:', data.data?.id);

  return {
    id: data.data?.id,
    type: data.data?.type,
    queuingOfficeId: data.data?.queuingOfficeId,
    associatedRecords: data.data?.associatedRecords,
    flightOffers: data.data?.flightOffers || [],
    travelers: data.data?.travelers || [],
    ticketingAgreement: data.data?.ticketingAgreement,
  };
}

// ============================================
// Flight Order Management API
// ============================================

export async function getFlightOrder(orderId: string): Promise<FlightOrderResult | null> {
  if (!isAmadeusConfigured()) {
    throw new Error('Amadeus API is not configured');
  }

  const token = await getAccessToken();
  const clientRef = generateClientRef();

  const response = await fetch(
    `${AMADEUS_BASE_URL}/v1/booking/flight-orders/${orderId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ama-client-ref': clientRef,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.text();
    console.error('Amadeus get order error:', error);
    throw new Error(`Amadeus get order failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data;
}

export async function getFlightOrderByReference(
  reference: string,
  originSystemCode: string = 'GDS'
): Promise<FlightOrderResult | null> {
  if (!isAmadeusConfigured()) {
    throw new Error('Amadeus API is not configured');
  }

  const token = await getAccessToken();
  const clientRef = generateClientRef();

  const url = `${AMADEUS_BASE_URL}/v1/booking/flight-orders/by-reference?reference=${encodeURIComponent(reference)}&originSystemCode=${encodeURIComponent(originSystemCode)}`;
  
  console.log('Amadeus get order by reference:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'ama-client-ref': clientRef,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.text();
    console.error('Amadeus get order by reference error:', error);
    throw new Error(`Amadeus get order by reference failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('Amadeus by-reference raw response:', JSON.stringify(data, null, 2));
  
  // The by-reference API returns an array of orders
  const orders = data.data;
  if (Array.isArray(orders) && orders.length === 0) {
    console.log('No orders found for reference:', reference);
    return null;
  }
  
  // Return the first order if array, or the data itself if single object
  return Array.isArray(orders) ? orders[0] : orders;
}

export async function cancelFlightOrder(orderId: string): Promise<boolean> {
  if (!isAmadeusConfigured()) {
    throw new Error('Amadeus API is not configured');
  }

  const token = await getAccessToken();
  const clientRef = generateClientRef();

  const response = await fetch(
    `${AMADEUS_BASE_URL}/v1/booking/flight-orders/${orderId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ama-client-ref': clientRef,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus cancel order error:', error);
    throw new Error(`Amadeus order cancellation failed: ${response.status} - ${error}`);
  }

  console.log('Amadeus order cancelled:', orderId);
  return true;
}

// ============================================
// Seat Assignment Interface
// ============================================

export interface SeatAssignment {
  segmentId: string;
  seatNumber: string;
}

export interface TravelerSeatAssignment {
  travelerId: string;
  seats: SeatAssignment[];
}

export interface AddSeatsParams {
  orderId: string;
  travelerSeats: TravelerSeatAssignment[];
  remarks?: {
    general?: Array<{
      subType: string;
      text: string;
    }>;
  };
}

export async function addSeatsToOrder(params: AddSeatsParams): Promise<FlightOrderResult> {
  if (!isAmadeusConfigured()) {
    throw new Error('Amadeus API is not configured');
  }

  const token = await getAccessToken();
  const clientRef = generateClientRef();

  // Build traveler pricing with seat assignments
  const travelerPricings = params.travelerSeats.map((ts) => ({
    travelerId: ts.travelerId,
    fareDetailsBySegment: ts.seats.map((seat) => ({
      segmentId: seat.segmentId,
      additionalServices: {
        chargeableSeatNumber: seat.seatNumber,
      },
    })),
  }));

  const requestBody = {
    data: {
      type: 'flight-order',
      id: params.orderId,
      flightOffers: [
        {
          type: 'flight-offer',
          id: '1',
          travelerPricings,
        },
      ],
      remarks: params.remarks || {
        general: [
          {
            subType: 'GENERAL_MISCELLANEOUS',
            text: `Seats added - ${new Date().toISOString()}`,
          },
        ],
      },
    },
  };

  console.log('Amadeus add seats request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `${AMADEUS_BASE_URL}/v1/booking/flight-orders/${params.orderId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ama-client-ref': clientRef,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus add seats error:', error);
    throw new Error(`Amadeus seat assignment failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('Amadeus seats added to order:', params.orderId);
  return data.data;
}

// ============================================
// Update Traveler Information
// ============================================

export interface TravelerDocument {
  documentType: 'PASSPORT' | 'IDENTITY_CARD' | 'VISA';
  birthPlace?: string;
  issuanceLocation?: string;
  issuanceDate?: string;
  number: string;
  expiryDate: string;
  issuanceCountry: string;
  validityCountry?: string;
  nationality: string;
  holder?: boolean;
}

export interface TravelerPhone {
  deviceType: 'MOBILE' | 'LANDLINE';
  countryCallingCode: string;
  number: string;
}

export interface TravelerUpdate {
  id: string;
  dateOfBirth?: string;
  name?: {
    firstName: string;
    lastName: string;
  };
  gender?: 'MALE' | 'FEMALE';
  contact?: {
    emailAddress?: string;
    phones?: TravelerPhone[];
  };
  documents?: TravelerDocument[];
}

export interface UpdateTravelersParams {
  orderId: string;
  travelers: TravelerUpdate[];
  automatedProcess?: Array<{
    code: 'IMMEDIATE' | 'DELAYED';
    queue?: {
      number: string;
      category: string;
    };
    officeId?: string;
  }>;
  remarks?: {
    general?: Array<{
      subType: string;
      text: string;
    }>;
  };
}

export async function updateOrderTravelers(params: UpdateTravelersParams): Promise<FlightOrderResult> {
  if (!isAmadeusConfigured()) {
    throw new Error('Amadeus API is not configured');
  }

  const token = await getAccessToken();
  const clientRef = generateClientRef();

  const requestBody = {
    data: {
      type: 'flight-order',
      travelers: params.travelers,
      automatedProcess: params.automatedProcess,
      remarks: params.remarks,
    },
  };

  console.log('Amadeus update travelers request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `${AMADEUS_BASE_URL}/v1/booking/flight-orders/${params.orderId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ama-client-ref': clientRef,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus update travelers error:', error);
    throw new Error(`Amadeus traveler update failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('Amadeus travelers updated for order:', params.orderId);
  return data.data;
}

// ============================================
// Commission Management
// ============================================

export interface CommissionValue {
  commissionType: 'NEW' | 'VAT_ON_NEW' | 'OLD' | 'VAT_ON_OLD';
  amount?: string;
  percentage?: string;
}

export interface Commission {
  controls: Array<'MANUAL' | 'AUTOMATIC'>;
  values: CommissionValue[];
  travelerIds: string[];
}

export interface AddCommissionsParams {
  orderId: string;
  commissions: Commission[];
}

export async function addOrderCommissions(params: AddCommissionsParams): Promise<FlightOrderResult> {
  if (!isAmadeusConfigured()) {
    throw new Error('Amadeus API is not configured');
  }

  const token = await getAccessToken();
  const clientRef = generateClientRef();

  const requestBody = {
    data: {
      type: 'flight-order',
      commissions: params.commissions,
    },
  };

  console.log('Amadeus add commissions request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `${AMADEUS_BASE_URL}/v1/booking/flight-orders/${params.orderId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ama-client-ref': clientRef,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus add commissions error:', error);
    throw new Error(`Amadeus commission update failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('Amadeus commissions added to order:', params.orderId);
  return data.data;
}

// Store raw flight offers for pricing/booking
const flightOfferCache = new Map<string, any>();

export function cacheFlightOffer(id: string, offer: any): void {
  flightOfferCache.set(id, offer);
}

export function getCachedFlightOffer(id: string): any | null {
  return flightOfferCache.get(id) || null;
}

export function clearFlightOfferCache(): void {
  flightOfferCache.clear();
}
