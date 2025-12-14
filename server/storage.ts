import { 
  type User, type UpsertUser,
  type Flight, type InsertFlight,
  type Booking, type InsertBooking,
  type Passenger, type InsertPassenger,
  type Seat, type InsertSeat,
  type Airport, type Airline, type FareType,
  type FlightSearch
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getAirports(): Promise<Airport[]>;
  getAirport(code: string): Promise<Airport | undefined>;
  
  getAirlines(): Promise<Airline[]>;
  getAirline(code: string): Promise<Airline | undefined>;
  
  searchFlights(search: FlightSearch): Promise<Flight[]>;
  getFlight(id: string): Promise<Flight | undefined>;
  getFlightWithDetails(id: string): Promise<FlightWithDetails | undefined>;
  cacheAmadeusFlight(flight: Flight): Promise<void>;
  ensureAirlineExists(code: string, name: string): Promise<void>;
  
  getFareTypes(): Promise<FareType[]>;
  getFareType(id: string): Promise<FareType | undefined>;
  
  getSeatsForFlight(flightId: string): Promise<Seat[]>;
  getSeat(id: string): Promise<Seat | undefined>;
  updateSeatOccupied(id: string, occupied: boolean): Promise<void>;
  
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingByReference(reference: string): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  updateBookingStatus(id: string, status: string, paymentId?: string): Promise<void>;
  
  createPassenger(passenger: InsertPassenger): Promise<Passenger>;
  getPassengersForBooking(bookingId: string): Promise<Passenger[]>;
  updatePassengerSeat(passengerId: string, seatId: string): Promise<void>;
}

export interface FlightWithDetails extends Flight {
  airline: Airline;
  departureAirportInfo: Airport;
  arrivalAirportInfo: Airport;
}

function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let reference = "TS-";
  for (let i = 0; i < 6; i++) {
    reference += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return reference;
}

function generateSeatsForFlight(flightId: string): Seat[] {
  const seats: Seat[] = [];
  const columns = ["A", "B", "C", "D", "E", "F"];
  
  for (let row = 1; row <= 25; row++) {
    for (const col of columns) {
      const isExit = row === 12 || row === 13;
      const isPremium = row <= 4;
      const isOccupied = Math.random() < 0.2;
      
      seats.push({
        id: `${flightId}-${row}${col}`,
        flightId,
        row,
        column: col,
        type: isPremium ? "premium" : isExit ? "exit" : "standard",
        price: isPremium ? 65 : isExit ? 45 : 0,
        occupied: isOccupied,
      });
    }
  }
  return seats;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private airports: Map<string, Airport>;
  private airlines: Map<string, Airline>;
  private flights: Map<string, Flight>;
  private fareTypes: Map<string, FareType>;
  private seats: Map<string, Seat>;
  private bookings: Map<string, Booking>;
  private passengers: Map<string, Passenger>;

  constructor() {
    this.users = new Map();
    this.airports = new Map();
    this.airlines = new Map();
    this.flights = new Map();
    this.fareTypes = new Map();
    this.seats = new Map();
    this.bookings = new Map();
    this.passengers = new Map();
    
    this.seedData();
  }

  private seedData() {
    const airportData: Airport[] = [
      // Africa
      { code: "NBO", name: "Jomo Kenyatta International", city: "Nairobi", country: "Kenya" },
      { code: "MBA", name: "Moi International", city: "Mombasa", country: "Kenya" },
      { code: "ADD", name: "Bole International", city: "Addis Ababa", country: "Ethiopia" },
      { code: "JNB", name: "O.R. Tambo International", city: "Johannesburg", country: "South Africa" },
      { code: "CPT", name: "Cape Town International", city: "Cape Town", country: "South Africa" },
      { code: "DUR", name: "King Shaka International", city: "Durban", country: "South Africa" },
      { code: "LOS", name: "Murtala Muhammed International", city: "Lagos", country: "Nigeria" },
      { code: "ABV", name: "Nnamdi Azikiwe International", city: "Abuja", country: "Nigeria" },
      { code: "CAI", name: "Cairo International", city: "Cairo", country: "Egypt" },
      { code: "HRG", name: "Hurghada International", city: "Hurghada", country: "Egypt" },
      { code: "SSH", name: "Sharm El Sheikh International", city: "Sharm El Sheikh", country: "Egypt" },
      { code: "CMN", name: "Mohammed V International", city: "Casablanca", country: "Morocco" },
      { code: "RAK", name: "Marrakech Menara", city: "Marrakech", country: "Morocco" },
      { code: "TNG", name: "Ibn Battouta", city: "Tangier", country: "Morocco" },
      { code: "ALG", name: "Houari Boumediene", city: "Algiers", country: "Algeria" },
      { code: "TUN", name: "Tunis-Carthage", city: "Tunis", country: "Tunisia" },
      { code: "ACC", name: "Kotoka International", city: "Accra", country: "Ghana" },
      { code: "DAR", name: "Julius Nyerere International", city: "Dar es Salaam", country: "Tanzania" },
      { code: "ZNZ", name: "Abeid Amani Karume", city: "Zanzibar", country: "Tanzania" },
      { code: "JRO", name: "Kilimanjaro International", city: "Kilimanjaro", country: "Tanzania" },
      { code: "EBB", name: "Entebbe International", city: "Entebbe", country: "Uganda" },
      { code: "KGL", name: "Kigali International", city: "Kigali", country: "Rwanda" },
      { code: "MRU", name: "Sir Seewoosagur Ramgoolam", city: "Port Louis", country: "Mauritius" },
      { code: "SEZ", name: "Seychelles International", city: "Victoria", country: "Seychelles" },
      { code: "DKR", name: "Blaise Diagne International", city: "Dakar", country: "Senegal" },
      { code: "ABJ", name: "Felix Houphouet-Boigny", city: "Abidjan", country: "Ivory Coast" },
      { code: "LUN", name: "Kenneth Kaunda", city: "Lusaka", country: "Zambia" },
      { code: "HRE", name: "Robert Gabriel Mugabe", city: "Harare", country: "Zimbabwe" },
      { code: "VFA", name: "Victoria Falls", city: "Victoria Falls", country: "Zimbabwe" },
      { code: "WDH", name: "Hosea Kutako", city: "Windhoek", country: "Namibia" },
      { code: "GBE", name: "Sir Seretse Khama", city: "Gaborone", country: "Botswana" },
      { code: "MPM", name: "Maputo International", city: "Maputo", country: "Mozambique" },
      { code: "LLW", name: "Lilongwe International", city: "Lilongwe", country: "Malawi" },
      
      // Europe
      { code: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom" },
      { code: "LGW", name: "Gatwick Airport", city: "London", country: "United Kingdom" },
      { code: "STN", name: "Stansted Airport", city: "London", country: "United Kingdom" },
      { code: "LTN", name: "Luton Airport", city: "London", country: "United Kingdom" },
      { code: "MAN", name: "Manchester Airport", city: "Manchester", country: "United Kingdom" },
      { code: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom" },
      { code: "BHX", name: "Birmingham Airport", city: "Birmingham", country: "United Kingdom" },
      { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France" },
      { code: "ORY", name: "Paris Orly", city: "Paris", country: "France" },
      { code: "NCE", name: "Nice Cote d'Azur", city: "Nice", country: "France" },
      { code: "LYS", name: "Lyon-Saint Exupery", city: "Lyon", country: "France" },
      { code: "MRS", name: "Marseille Provence", city: "Marseille", country: "France" },
      { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany" },
      { code: "MUC", name: "Munich Airport", city: "Munich", country: "Germany" },
      { code: "TXL", name: "Berlin Brandenburg", city: "Berlin", country: "Germany" },
      { code: "BER", name: "Berlin Brandenburg", city: "Berlin", country: "Germany" },
      { code: "DUS", name: "Dusseldorf Airport", city: "Dusseldorf", country: "Germany" },
      { code: "HAM", name: "Hamburg Airport", city: "Hamburg", country: "Germany" },
      { code: "AMS", name: "Schiphol Airport", city: "Amsterdam", country: "Netherlands" },
      { code: "MAD", name: "Adolfo Suarez Madrid-Barajas", city: "Madrid", country: "Spain" },
      { code: "BCN", name: "Barcelona El Prat", city: "Barcelona", country: "Spain" },
      { code: "AGP", name: "Malaga Costa del Sol", city: "Malaga", country: "Spain" },
      { code: "PMI", name: "Palma de Mallorca", city: "Palma", country: "Spain" },
      { code: "FCO", name: "Leonardo da Vinci-Fiumicino", city: "Rome", country: "Italy" },
      { code: "MXP", name: "Milan Malpensa", city: "Milan", country: "Italy" },
      { code: "LIN", name: "Milan Linate", city: "Milan", country: "Italy" },
      { code: "VCE", name: "Venice Marco Polo", city: "Venice", country: "Italy" },
      { code: "NAP", name: "Naples International", city: "Naples", country: "Italy" },
      { code: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland" },
      { code: "GVA", name: "Geneva Airport", city: "Geneva", country: "Switzerland" },
      { code: "VIE", name: "Vienna International", city: "Vienna", country: "Austria" },
      { code: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium" },
      { code: "LIS", name: "Lisbon Portela", city: "Lisbon", country: "Portugal" },
      { code: "OPO", name: "Francisco Sa Carneiro", city: "Porto", country: "Portugal" },
      { code: "ATH", name: "Athens International", city: "Athens", country: "Greece" },
      { code: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland" },
      { code: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark" },
      { code: "OSL", name: "Oslo Gardermoen", city: "Oslo", country: "Norway" },
      { code: "ARN", name: "Stockholm Arlanda", city: "Stockholm", country: "Sweden" },
      { code: "HEL", name: "Helsinki-Vantaa", city: "Helsinki", country: "Finland" },
      { code: "WAW", name: "Warsaw Chopin", city: "Warsaw", country: "Poland" },
      { code: "PRG", name: "Vaclav Havel Prague", city: "Prague", country: "Czech Republic" },
      { code: "BUD", name: "Budapest Ferenc Liszt", city: "Budapest", country: "Hungary" },
      { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey" },
      { code: "SAW", name: "Istanbul Sabiha Gokcen", city: "Istanbul", country: "Turkey" },
      { code: "AYT", name: "Antalya Airport", city: "Antalya", country: "Turkey" },
      
      // Middle East
      { code: "DXB", name: "Dubai International", city: "Dubai", country: "UAE" },
      { code: "AUH", name: "Abu Dhabi International", city: "Abu Dhabi", country: "UAE" },
      { code: "SHJ", name: "Sharjah International", city: "Sharjah", country: "UAE" },
      { code: "DOH", name: "Hamad International", city: "Doha", country: "Qatar" },
      { code: "RUH", name: "King Khalid International", city: "Riyadh", country: "Saudi Arabia" },
      { code: "JED", name: "King Abdulaziz International", city: "Jeddah", country: "Saudi Arabia" },
      { code: "DMM", name: "King Fahd International", city: "Dammam", country: "Saudi Arabia" },
      { code: "BAH", name: "Bahrain International", city: "Manama", country: "Bahrain" },
      { code: "KWI", name: "Kuwait International", city: "Kuwait City", country: "Kuwait" },
      { code: "MCT", name: "Muscat International", city: "Muscat", country: "Oman" },
      { code: "AMM", name: "Queen Alia International", city: "Amman", country: "Jordan" },
      { code: "TLV", name: "Ben Gurion International", city: "Tel Aviv", country: "Israel" },
      { code: "BEY", name: "Rafic Hariri International", city: "Beirut", country: "Lebanon" },
      
      // Asia
      { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand" },
      { code: "DMK", name: "Don Mueang", city: "Bangkok", country: "Thailand" },
      { code: "HKT", name: "Phuket International", city: "Phuket", country: "Thailand" },
      { code: "CNX", name: "Chiang Mai International", city: "Chiang Mai", country: "Thailand" },
      { code: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore" },
      { code: "KUL", name: "Kuala Lumpur International", city: "Kuala Lumpur", country: "Malaysia" },
      { code: "CGK", name: "Soekarno-Hatta International", city: "Jakarta", country: "Indonesia" },
      { code: "DPS", name: "Ngurah Rai International", city: "Bali", country: "Indonesia" },
      { code: "MNL", name: "Ninoy Aquino International", city: "Manila", country: "Philippines" },
      { code: "CEB", name: "Mactan-Cebu International", city: "Cebu", country: "Philippines" },
      { code: "SGN", name: "Tan Son Nhat International", city: "Ho Chi Minh City", country: "Vietnam" },
      { code: "HAN", name: "Noi Bai International", city: "Hanoi", country: "Vietnam" },
      { code: "DAD", name: "Da Nang International", city: "Da Nang", country: "Vietnam" },
      { code: "HKG", name: "Hong Kong International", city: "Hong Kong", country: "Hong Kong" },
      { code: "PVG", name: "Pudong International", city: "Shanghai", country: "China" },
      { code: "SHA", name: "Hongqiao International", city: "Shanghai", country: "China" },
      { code: "PEK", name: "Beijing Capital", city: "Beijing", country: "China" },
      { code: "PKX", name: "Beijing Daxing", city: "Beijing", country: "China" },
      { code: "CAN", name: "Guangzhou Baiyun", city: "Guangzhou", country: "China" },
      { code: "SZX", name: "Shenzhen Bao'an", city: "Shenzhen", country: "China" },
      { code: "CTU", name: "Chengdu Shuangliu", city: "Chengdu", country: "China" },
      { code: "NRT", name: "Narita International", city: "Tokyo", country: "Japan" },
      { code: "HND", name: "Tokyo Haneda", city: "Tokyo", country: "Japan" },
      { code: "KIX", name: "Kansai International", city: "Osaka", country: "Japan" },
      { code: "ICN", name: "Incheon International", city: "Seoul", country: "South Korea" },
      { code: "GMP", name: "Gimpo International", city: "Seoul", country: "South Korea" },
      { code: "TPE", name: "Taiwan Taoyuan", city: "Taipei", country: "Taiwan" },
      { code: "DEL", name: "Indira Gandhi International", city: "New Delhi", country: "India" },
      { code: "BOM", name: "Chhatrapati Shivaji", city: "Mumbai", country: "India" },
      { code: "BLR", name: "Kempegowda International", city: "Bangalore", country: "India" },
      { code: "MAA", name: "Chennai International", city: "Chennai", country: "India" },
      { code: "CCU", name: "Netaji Subhas Chandra Bose", city: "Kolkata", country: "India" },
      { code: "HYD", name: "Rajiv Gandhi International", city: "Hyderabad", country: "India" },
      { code: "COK", name: "Cochin International", city: "Kochi", country: "India" },
      { code: "CMB", name: "Bandaranaike International", city: "Colombo", country: "Sri Lanka" },
      { code: "MLE", name: "Velana International", city: "Male", country: "Maldives" },
      { code: "KTM", name: "Tribhuvan International", city: "Kathmandu", country: "Nepal" },
      { code: "DAC", name: "Hazrat Shahjalal", city: "Dhaka", country: "Bangladesh" },
      { code: "KHI", name: "Jinnah International", city: "Karachi", country: "Pakistan" },
      { code: "ISB", name: "Islamabad International", city: "Islamabad", country: "Pakistan" },
      { code: "LHE", name: "Allama Iqbal International", city: "Lahore", country: "Pakistan" },
      
      // North America
      { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "United States" },
      { code: "EWR", name: "Newark Liberty International", city: "Newark", country: "United States" },
      { code: "LGA", name: "LaGuardia Airport", city: "New York", country: "United States" },
      { code: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "United States" },
      { code: "SFO", name: "San Francisco International", city: "San Francisco", country: "United States" },
      { code: "ORD", name: "O'Hare International", city: "Chicago", country: "United States" },
      { code: "ATL", name: "Hartsfield-Jackson Atlanta", city: "Atlanta", country: "United States" },
      { code: "DFW", name: "Dallas/Fort Worth International", city: "Dallas", country: "United States" },
      { code: "DEN", name: "Denver International", city: "Denver", country: "United States" },
      { code: "SEA", name: "Seattle-Tacoma International", city: "Seattle", country: "United States" },
      { code: "MIA", name: "Miami International", city: "Miami", country: "United States" },
      { code: "BOS", name: "Boston Logan International", city: "Boston", country: "United States" },
      { code: "IAD", name: "Washington Dulles International", city: "Washington D.C.", country: "United States" },
      { code: "DCA", name: "Ronald Reagan Washington", city: "Washington D.C.", country: "United States" },
      { code: "PHX", name: "Phoenix Sky Harbor", city: "Phoenix", country: "United States" },
      { code: "LAS", name: "Harry Reid International", city: "Las Vegas", country: "United States" },
      { code: "MCO", name: "Orlando International", city: "Orlando", country: "United States" },
      { code: "IAH", name: "George Bush Intercontinental", city: "Houston", country: "United States" },
      { code: "MSP", name: "Minneapolis-Saint Paul", city: "Minneapolis", country: "United States" },
      { code: "DTW", name: "Detroit Metropolitan", city: "Detroit", country: "United States" },
      { code: "PHL", name: "Philadelphia International", city: "Philadelphia", country: "United States" },
      { code: "SAN", name: "San Diego International", city: "San Diego", country: "United States" },
      { code: "HNL", name: "Daniel K. Inouye", city: "Honolulu", country: "United States" },
      { code: "YYZ", name: "Toronto Pearson International", city: "Toronto", country: "Canada" },
      { code: "YVR", name: "Vancouver International", city: "Vancouver", country: "Canada" },
      { code: "YUL", name: "Montreal-Trudeau", city: "Montreal", country: "Canada" },
      { code: "YYC", name: "Calgary International", city: "Calgary", country: "Canada" },
      { code: "YEG", name: "Edmonton International", city: "Edmonton", country: "Canada" },
      { code: "YOW", name: "Ottawa Macdonald-Cartier", city: "Ottawa", country: "Canada" },
      { code: "MEX", name: "Mexico City International", city: "Mexico City", country: "Mexico" },
      { code: "CUN", name: "Cancun International", city: "Cancun", country: "Mexico" },
      { code: "GDL", name: "Guadalajara International", city: "Guadalajara", country: "Mexico" },
      
      // South America
      { code: "GRU", name: "Sao Paulo-Guarulhos", city: "Sao Paulo", country: "Brazil" },
      { code: "GIG", name: "Rio de Janeiro-Galeao", city: "Rio de Janeiro", country: "Brazil" },
      { code: "BSB", name: "Brasilia International", city: "Brasilia", country: "Brazil" },
      { code: "EZE", name: "Ministro Pistarini", city: "Buenos Aires", country: "Argentina" },
      { code: "AEP", name: "Jorge Newbery", city: "Buenos Aires", country: "Argentina" },
      { code: "SCL", name: "Arturo Merino Benitez", city: "Santiago", country: "Chile" },
      { code: "LIM", name: "Jorge Chavez International", city: "Lima", country: "Peru" },
      { code: "BOG", name: "El Dorado International", city: "Bogota", country: "Colombia" },
      { code: "CTG", name: "Rafael Nunez International", city: "Cartagena", country: "Colombia" },
      { code: "UIO", name: "Mariscal Sucre", city: "Quito", country: "Ecuador" },
      { code: "CCS", name: "Simon Bolivar International", city: "Caracas", country: "Venezuela" },
      { code: "PTY", name: "Tocumen International", city: "Panama City", country: "Panama" },
      { code: "SJO", name: "Juan Santamaria International", city: "San Jose", country: "Costa Rica" },
      
      // Oceania
      { code: "SYD", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia" },
      { code: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia" },
      { code: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia" },
      { code: "PER", name: "Perth Airport", city: "Perth", country: "Australia" },
      { code: "ADL", name: "Adelaide Airport", city: "Adelaide", country: "Australia" },
      { code: "CNS", name: "Cairns Airport", city: "Cairns", country: "Australia" },
      { code: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand" },
      { code: "WLG", name: "Wellington Airport", city: "Wellington", country: "New Zealand" },
      { code: "CHC", name: "Christchurch Airport", city: "Christchurch", country: "New Zealand" },
      { code: "NAN", name: "Nadi International", city: "Nadi", country: "Fiji" },
      { code: "PPT", name: "Faa'a International", city: "Papeete", country: "French Polynesia" },
    ];
    
    airportData.forEach(a => this.airports.set(a.code, a));

    const airlineData: Airline[] = [
      { code: "KQ", name: "Kenya Airways", logo: "https://pics.avs.io/200/200/KQ.png" },
      { code: "ET", name: "Ethiopian Airlines", logo: "https://pics.avs.io/200/200/ET.png" },
      { code: "SA", name: "South African Airways", logo: "https://pics.avs.io/200/200/SA.png" },
      { code: "EK", name: "Emirates", logo: "https://pics.avs.io/200/200/EK.png" },
      { code: "BA", name: "British Airways", logo: "https://pics.avs.io/200/200/BA.png" },
      { code: "AF", name: "Air France", logo: "https://pics.avs.io/200/200/AF.png" },
      { code: "MS", name: "EgyptAir", logo: "https://pics.avs.io/200/200/MS.png" },
      { code: "AT", name: "Royal Air Maroc", logo: "https://pics.avs.io/200/200/AT.png" },
    ];
    
    airlineData.forEach(a => this.airlines.set(a.code, a));

    const fareTypeData: FareType[] = [
      {
        id: "light",
        name: "Economy Light",
        priceMultiplier: 1,
        carryOn: "1 x 10kg",
        checkedBag: "No checked bag",
        seatSelection: false,
        changeFee: "From $150",
        cancellationFee: "Non-refundable",
        mileageAccrual: "50%",
      },
      {
        id: "standard",
        name: "Economy Standard",
        priceMultiplier: 1.15,
        carryOn: "1 x 10kg",
        checkedBag: "1 x 23kg included",
        seatSelection: true,
        changeFee: "From $75",
        cancellationFee: "From $150",
        mileageAccrual: "100%",
      },
      {
        id: "flex",
        name: "Economy Flex",
        priceMultiplier: 1.35,
        carryOn: "1 x 10kg",
        checkedBag: "2 x 23kg included",
        seatSelection: true,
        changeFee: "Free",
        cancellationFee: "Free",
        mileageAccrual: "150%",
      },
    ];
    
    fareTypeData.forEach(f => this.fareTypes.set(f.id, f));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = userData.id ? this.users.get(userData.id) : undefined;
    const user: User = {
      id: userData.id || randomUUID(),
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      isAdmin: userData.isAdmin ?? existingUser?.isAdmin ?? false,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getAirports(): Promise<Airport[]> {
    return Array.from(this.airports.values());
  }

  async getAirport(code: string): Promise<Airport | undefined> {
    return this.airports.get(code);
  }

  async getAirlines(): Promise<Airline[]> {
    return Array.from(this.airlines.values());
  }

  async getAirline(code: string): Promise<Airline | undefined> {
    return this.airlines.get(code);
  }

  async searchFlights(search: FlightSearch): Promise<Flight[]> {
    const allFlights = Array.from(this.flights.values());
    
    return allFlights.filter(flight => {
      const matchesOrigin = !search.origin || flight.departureAirport === search.origin;
      const matchesDestination = !search.destination || flight.arrivalAirport === search.destination;
      const matchesDate = !search.departureDate || flight.departureDate === search.departureDate;
      const hasSeats = flight.availableSeats >= search.passengers;
      
      return matchesOrigin && matchesDestination && matchesDate && hasSeats;
    });
  }

  async getFlight(id: string): Promise<Flight | undefined> {
    return this.flights.get(id);
  }

  async getFlightWithDetails(id: string): Promise<FlightWithDetails | undefined> {
    const flight = this.flights.get(id);
    if (!flight) return undefined;

    const airline = this.airlines.get(flight.airlineCode);
    const departureAirportInfo = this.airports.get(flight.departureAirport);
    const arrivalAirportInfo = this.airports.get(flight.arrivalAirport);

    if (!airline || !departureAirportInfo || !arrivalAirportInfo) return undefined;

    return {
      ...flight,
      airline,
      departureAirportInfo,
      arrivalAirportInfo,
    };
  }

  async getFareTypes(): Promise<FareType[]> {
    return Array.from(this.fareTypes.values());
  }

  async getFareType(id: string): Promise<FareType | undefined> {
    return this.fareTypes.get(id);
  }

  async getSeatsForFlight(flightId: string): Promise<Seat[]> {
    return Array.from(this.seats.values()).filter(s => s.flightId === flightId);
  }

  async getSeat(id: string): Promise<Seat | undefined> {
    return this.seats.get(id);
  }

  async updateSeatOccupied(id: string, occupied: boolean): Promise<void> {
    const seat = this.seats.get(id);
    if (seat) {
      this.seats.set(id, { ...seat, occupied });
    }
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const reference = generateBookingReference();
    const booking: Booking = { 
      id,
      reference,
      flightId: insertBooking.flightId,
      fareTypeId: insertBooking.fareTypeId,
      contactEmail: insertBooking.contactEmail,
      contactPhone: insertBooking.contactPhone ?? null,
      totalAmount: insertBooking.totalAmount,
      currency: insertBooking.currency ?? "USD",
      status: insertBooking.status ?? "pending",
      paymentMethod: insertBooking.paymentMethod ?? null,
      paymentId: insertBooking.paymentId ?? null,
      createdAt: new Date(),
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingByReference(reference: string): Promise<Booking | undefined> {
    return Array.from(this.bookings.values()).find(b => b.reference === reference);
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async updateBookingStatus(id: string, status: string, paymentId?: string): Promise<void> {
    const booking = this.bookings.get(id);
    if (booking) {
      this.bookings.set(id, { 
        ...booking, 
        status,
        ...(paymentId && { paymentId }),
      });
    }
  }

  async createPassenger(insertPassenger: InsertPassenger): Promise<Passenger> {
    const id = randomUUID();
    const passenger: Passenger = { 
      id,
      bookingId: insertPassenger.bookingId,
      firstName: insertPassenger.firstName,
      lastName: insertPassenger.lastName,
      gender: insertPassenger.gender,
      dateOfBirth: insertPassenger.dateOfBirth,
      nationality: insertPassenger.nationality ?? null,
      documentType: insertPassenger.documentType ?? "passport",
      documentNumber: insertPassenger.documentNumber ?? null,
      documentExpiry: insertPassenger.documentExpiry ?? null,
      seatId: insertPassenger.seatId ?? null,
    };
    this.passengers.set(id, passenger);
    return passenger;
  }

  async getPassengersForBooking(bookingId: string): Promise<Passenger[]> {
    return Array.from(this.passengers.values()).filter(p => p.bookingId === bookingId);
  }

  async updatePassengerSeat(passengerId: string, seatId: string): Promise<void> {
    const passenger = this.passengers.get(passengerId);
    if (passenger) {
      this.passengers.set(passengerId, { ...passenger, seatId });
    }
  }

  async cacheAmadeusFlight(flight: Flight): Promise<void> {
    this.flights.set(flight.id, flight);
    const existingSeats = await this.getSeatsForFlight(flight.id);
    if (existingSeats.length === 0) {
      const seats = generateSeatsForFlight(flight.id);
      seats.forEach(seat => this.seats.set(seat.id, seat));
    }
  }

  async ensureAirlineExists(code: string, name: string): Promise<void> {
    if (!this.airlines.has(code)) {
      this.airlines.set(code, { code, name, logo: null });
    }
  }
}

export const storage = new MemStorage();
