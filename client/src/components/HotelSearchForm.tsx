import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { Building2, CalendarIcon, Users, Search, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HotelSearchData {
  destination: string;
  destinationCode: string;
  checkIn: Date;
  checkOut: Date;
  rooms: number;
  adults: number;
  children: number;
}

interface HotelSearchFormProps {
  onSearch: (data: HotelSearchData) => void;
  isLoading?: boolean;
  variant?: "default" | "compact";
}

const DESTINATIONS = [
  { name: "London", code: "LON" },
  { name: "Paris", code: "PAR" },
  { name: "Dubai", code: "DXB" },
  { name: "New York", code: "NYC" },
  { name: "Lagos", code: "LOS" },
  { name: "Nairobi", code: "NBO" },
  { name: "Cairo", code: "CAI" },
  { name: "Johannesburg", code: "JNB" },
  { name: "Cape Town", code: "CPT" },
  { name: "Casablanca", code: "CAS" },
  { name: "Accra", code: "ACC" },
  { name: "Addis Ababa", code: "ADD" },
  { name: "Marrakech", code: "RAK" },
  { name: "Zanzibar", code: "ZNZ" },
  { name: "Mombasa", code: "MBA" },
  { name: "Amsterdam", code: "AMS" },
  { name: "Barcelona", code: "BCN" },
  { name: "Rome", code: "ROM" },
  { name: "Madrid", code: "MAD" },
  { name: "Bangkok", code: "BKK" },
  { name: "Singapore", code: "SIN" },
  { name: "Tokyo", code: "TYO" },
  { name: "Sydney", code: "SYD" },
  { name: "Los Angeles", code: "LAX" },
  { name: "Miami", code: "MIA" },
];

export default function HotelSearchForm({ onSearch, isLoading, variant = "default" }: HotelSearchFormProps) {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>(addDays(new Date(), 7));
  const [checkOut, setCheckOut] = useState<Date | undefined>(addDays(new Date(), 10));
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [showGuests, setShowGuests] = useState(false);

  const handleSearch = () => {
    const dest = DESTINATIONS.find(d => d.code === destination);
    if (!dest || !checkIn || !checkOut) return;

    onSearch({
      destination: dest.name,
      destinationCode: dest.code,
      checkIn,
      checkOut,
      rooms,
      adults,
      children,
    });
  };

  const isCompact = variant === "compact";

  return (
    <Card className={cn(isCompact ? "border-0 shadow-none bg-transparent" : "")}>
      <CardContent className={cn(isCompact ? "p-0" : "p-6")}>
        <div className={cn(
          "grid gap-4",
          isCompact ? "grid-cols-1 md:grid-cols-5" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        )}>
          <div className="space-y-2">
            <Label htmlFor="destination" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Destination
            </Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger data-testid="select-hotel-destination">
                <SelectValue placeholder="Where are you going?" />
              </SelectTrigger>
              <SelectContent>
                {DESTINATIONS.map((dest) => (
                  <SelectItem key={dest.code} value={dest.code}>
                    {dest.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Check-in
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-hotel-checkin"
                >
                  {checkIn ? format(checkIn, "MMM dd, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={setCheckIn}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Check-out
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-hotel-checkout"
                >
                  {checkOut ? format(checkOut, "MMM dd, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={setCheckOut}
                  disabled={(date) => date < (checkIn || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Guests & Rooms
            </Label>
            <Popover open={showGuests} onOpenChange={setShowGuests}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-hotel-guests"
                >
                  {rooms} room, {adults} adult{adults > 1 ? "s" : ""}{children > 0 ? `, ${children} child${children > 1 ? "ren" : ""}` : ""}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rooms</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setRooms(Math.max(1, rooms - 1))}
                        disabled={rooms <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center">{rooms}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setRooms(Math.min(9, rooms + 1))}
                        disabled={rooms >= 9}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Adults</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        disabled={adults <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center">{adults}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setAdults(Math.min(9, adults + 1))}
                        disabled={adults >= 9}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Children</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        disabled={children <= 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center">{children}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setChildren(Math.min(6, children + 1))}
                        disabled={children >= 6}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setShowGuests(false)}>
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className={cn("flex items-end", isCompact ? "" : "md:col-span-2 lg:col-span-4")}>
            <Button
              className="w-full"
              size="lg"
              onClick={handleSearch}
              disabled={!destination || !checkIn || !checkOut || isLoading}
              data-testid="button-search-hotels"
            >
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? "Searching..." : "Search Hotels"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
