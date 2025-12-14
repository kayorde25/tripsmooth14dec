import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import FlightSearchForm, { SearchData } from "@/components/FlightSearchForm";
import FlightCard, { Flight } from "@/components/FlightCard";
import FlightFilters, { FilterState } from "@/components/FlightFilters";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, ArrowUpDown } from "lucide-react";
import type { FareOption } from "@/components/BrandedFareSelector";
import { apiRequest } from "@/lib/queryClient";

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: string;
  tripType: string;
}

export default function Flights() {
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [sortBy, setSortBy] = useState("price");
  const [filters, setFilters] = useState<FilterState>({
    stops: [],
    airlines: [],
    priceRange: [0, 2000],
    baggageIncluded: false,
    departureTime: [],
  });

  const [searchParams, setSearchParams] = useState<SearchParams | null>(() => {
    const saved = localStorage.getItem("flightSearchParams");
    return saved ? JSON.parse(saved) : null;
  });

  const { data: flights = [], isLoading, refetch } = useQuery<Flight[]>({
    queryKey: ["/api/flights/search", searchParams],
    queryFn: async () => {
      if (!searchParams) return [];
      const response = await apiRequest("POST", "/api/flights/search", searchParams);
      return response.json();
    },
    enabled: !!searchParams,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const [passengerCount, setPassengerCount] = useState(1);

  const handleSearch = (searchData: SearchData) => {
    console.log("Search triggered:", searchData);
    const totalPassengers = searchData.passengers.adults + searchData.passengers.children + searchData.passengers.infants;
    setPassengerCount(totalPassengers);
    
    const params: SearchParams = {
      origin: searchData.from || '',
      destination: searchData.to || '',
      departureDate: searchData.departDate 
        ? searchData.departDate.toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      returnDate: searchData.returnDate
        ? searchData.returnDate.toISOString().split('T')[0]
        : undefined,
      passengers: totalPassengers,
      cabinClass: searchData.cabinClass || 'economy',
      tripType: searchData.tripType || 'oneway',
    };
    
    localStorage.setItem("flightSearchParams", JSON.stringify(params));
    localStorage.setItem("passengerCounts", JSON.stringify(searchData.passengers));
    setSearchParams(params);
  };

  const handleSelectFlight = (flight: Flight, fare?: FareOption) => {
    localStorage.setItem("selectedFlight", JSON.stringify(flight));
    if (fare) {
      localStorage.setItem("selectedFare", JSON.stringify(fare));
    }
    setLocation("/booking");
  };

  const filteredFlights = flights.filter((flight) => {
    if (filters.stops.length > 0) {
      const stopMatch = filters.stops.some((stop) => {
        if (stop === "non-stop") return flight.stops === 0;
        if (stop === "1-stop") return flight.stops === 1;
        if (stop === "2+-stops") return flight.stops >= 2;
        return true;
      });
      if (!stopMatch) return false;
    }

    if (filters.airlines.length > 0 && !filters.airlines.includes(flight.airline)) {
      return false;
    }

    if (flight.price < filters.priceRange[0] || flight.price > filters.priceRange[1]) {
      return false;
    }

    if (filters.baggageIncluded && !flight.baggageIncluded) {
      return false;
    }

    return true;
  });

  const sortedFlights = [...filteredFlights].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.price - b.price;
      case "duration":
        return a.duration.localeCompare(b.duration);
      case "departure":
        return a.departure.time.localeCompare(b.departure.time);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} onToggleTheme={handleThemeToggle} />

      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <FlightSearchForm variant="compact" onSearch={handleSearch} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-80 shrink-0">
            <FlightFilters filters={filters} onFilterChange={setFilters} />
          </aside>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold">Available Flights</h1>
                <p className="text-muted-foreground">
                  {isLoading ? "Loading..." : `${sortedFlights.length} flights found`}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden" data-testid="button-mobile-filters">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <FlightFilters filters={filters} onFilterChange={setFilters} />
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]" data-testid="select-sort">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price (Low to High)</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="departure">Departure Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-6 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                ))
              ) : sortedFlights.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No flights found matching your criteria.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setFilters({
                    stops: [],
                    airlines: [],
                    priceRange: [0, 2000],
                    baggageIncluded: false,
                    departureTime: [],
                  })}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                sortedFlights.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    onSelect={handleSelectFlight}
                    passengers={passengerCount}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
