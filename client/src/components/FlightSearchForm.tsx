import { useState } from "react";
import { ArrowRightLeft, Calendar, Users, Search, Plus, Minus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AirportSelect } from "@/components/AirportSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface FlightSearchFormProps {
  onSearch?: (searchData: SearchData) => void;
  variant?: "hero" | "compact";
}

export interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

export interface SearchData {
  tripType: string;
  from: string;
  to: string;
  departDate: Date | undefined;
  returnDate: Date | undefined;
  passengers: PassengerCounts;
  cabinClass: string;
}

export default function FlightSearchForm({ onSearch, variant = "hero" }: FlightSearchFormProps) {
  const [tripType, setTripType] = useState("round-trip");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departDate, setDepartDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengers, setPassengers] = useState<PassengerCounts>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [cabinClass, setCabinClass] = useState("economy");
  const [isPassengerOpen, setIsPassengerOpen] = useState(false);

  const handleSwapLocations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const updatePassengerCount = (type: keyof PassengerCounts, delta: number) => {
    setPassengers((prev) => {
      const newCount = prev[type] + delta;
      
      if (type === "adults") {
        if (newCount < 1) return prev;
        if (newCount > 9) return prev;
        const maxInfants = newCount;
        return {
          ...prev,
          adults: newCount,
          infants: Math.min(prev.infants, maxInfants),
        };
      }
      
      if (type === "children") {
        if (newCount < 0) return prev;
        if (newCount > 8) return prev;
        return { ...prev, children: newCount };
      }
      
      if (type === "infants") {
        if (newCount < 0) return prev;
        if (newCount > prev.adults) return prev;
        return { ...prev, infants: newCount };
      }
      
      return prev;
    });
  };

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  const getPassengerSummary = () => {
    const parts: string[] = [];
    if (passengers.adults > 0) {
      parts.push(`${passengers.adults} Adult${passengers.adults > 1 ? "s" : ""}`);
    }
    if (passengers.children > 0) {
      parts.push(`${passengers.children} Child${passengers.children > 1 ? "ren" : ""}`);
    }
    if (passengers.infants > 0) {
      parts.push(`${passengers.infants} Infant${passengers.infants > 1 ? "s" : ""}`);
    }
    return parts.join(", ");
  };

  const handleSearch = () => {
    const searchData: SearchData = {
      tripType,
      from,
      to,
      departDate,
      returnDate,
      passengers,
      cabinClass,
    };
    onSearch?.(searchData);
    console.log("Search triggered:", searchData);
  };

  const isCompact = variant === "compact";

  const PassengerCounter = ({ 
    label, 
    description, 
    value, 
    type,
    minDisabled,
    maxDisabled,
  }: { 
    label: string; 
    description: string; 
    value: number; 
    type: keyof PassengerCounts;
    minDisabled: boolean;
    maxDisabled: boolean;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => updatePassengerCount(type, -1)}
          disabled={minDisabled}
          data-testid={`button-${type}-minus`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-6 text-center font-medium" data-testid={`text-${type}-count`}>
          {value}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => updatePassengerCount(type, 1)}
          disabled={maxDisabled}
          data-testid={`button-${type}-plus`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Card className={`${isCompact ? "p-4" : "p-6 lg:p-8"} w-full`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <Tabs value={tripType} onValueChange={setTripType}>
            <TabsList>
              <TabsTrigger value="one-way" data-testid="tab-oneway">One Way</TabsTrigger>
              <TabsTrigger value="round-trip" data-testid="tab-roundtrip">Round Trip</TabsTrigger>
              <TabsTrigger value="multi-city" data-testid="tab-multicity">Multi-City</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-4">
            <Select value={cabinClass} onValueChange={setCabinClass}>
              <SelectTrigger className="w-[140px]" data-testid="select-cabin-class">
                <SelectValue placeholder="Cabin Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="premium">Premium Economy</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="first">First Class</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={`grid gap-4 ${isCompact ? "grid-cols-1 md:grid-cols-5" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-5"}`}>
          <div className="space-y-2 relative">
            <Label htmlFor="from" className="text-sm font-medium">From</Label>
            <AirportSelect
              value={from}
              onChange={setFrom}
              placeholder="Select departure"
              data-testid="input-from"
            />
          </div>

          <div className="flex items-end justify-center pb-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwapLocations}
              className="rounded-full"
              data-testid="button-swap-locations"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to" className="text-sm font-medium">To</Label>
            <AirportSelect
              value={to}
              onChange={setTo}
              placeholder="Select destination"
              data-testid="input-to"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Departure</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-depart-date"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {departDate ? format(departDate, "MMM dd, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={departDate}
                  onSelect={setDepartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {tripType === "round-trip" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Return</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-return-date"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {returnDate ? format(returnDate, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={returnDate}
                    onSelect={setReturnDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <Popover open={isPassengerOpen} onOpenChange={setIsPassengerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[200px] justify-start"
                  data-testid="button-passengers"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span className="truncate">{getPassengerSummary()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-1">
                  <h4 className="font-semibold">Passengers</h4>
                  <p className="text-sm text-muted-foreground">Select the number of travelers</p>
                </div>
                
                <div className="mt-4">
                  <PassengerCounter
                    label="Adults"
                    description="Age 12+"
                    value={passengers.adults}
                    type="adults"
                    minDisabled={passengers.adults <= 1}
                    maxDisabled={passengers.adults >= 9 || totalPassengers >= 9}
                  />
                  
                  <Separator />
                  
                  <PassengerCounter
                    label="Children"
                    description="Age 2-11"
                    value={passengers.children}
                    type="children"
                    minDisabled={passengers.children <= 0}
                    maxDisabled={passengers.children >= 8 || totalPassengers >= 9}
                  />
                  
                  <Separator />
                  
                  <PassengerCounter
                    label="Infants"
                    description="Under 2, on lap"
                    value={passengers.infants}
                    type="infants"
                    minDisabled={passengers.infants <= 0}
                    maxDisabled={passengers.infants >= passengers.adults}
                  />
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Infants must be under 2 years old on the date of travel and travel on an adult's lap. Maximum 1 infant per adult.
                    </p>
                  </div>
                </div>

                <Button 
                  className="w-full mt-4" 
                  onClick={() => setIsPassengerOpen(false)}
                  data-testid="button-passengers-done"
                >
                  Done
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          <Button
            size="lg"
            onClick={handleSearch}
            className="w-full sm:w-auto px-8"
            data-testid="button-search-flights"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Flights
          </Button>
        </div>
      </div>
    </Card>
  );
}
