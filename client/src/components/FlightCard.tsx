import { Plane, Clock, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BrandedFareSelector, { FareOption } from "./BrandedFareSelector";

export interface Flight {
  id: string;
  airline: string;
  airlineLogo?: string;
  airlineCode?: string;
  flightNumber: string;
  departure: {
    time: string;
    airport: string;
    city: string;
    date?: string;
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
  availableSeats?: number;
  tags?: string[];
  source?: string;
}

interface FlightCardProps {
  flight: Flight;
  onSelect?: (flight: Flight, fare?: FareOption) => void;
  passengers?: number;
}

export default function FlightCard({ flight, onSelect, passengers = 1 }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showFareSelector, setShowFareSelector] = useState(false);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSelectClick = () => {
    setShowFareSelector(true);
  };

  const handleFareSelect = (selectedFlight: Flight, fare: FareOption) => {
    setShowFareSelector(false);
    onSelect?.(selectedFlight, fare);
  };

  return (
    <Card className="hover-elevate overflow-visible" data-testid={`card-flight-${flight.id}`}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-3 min-w-[140px]">
            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center shrink-0 overflow-hidden">
              {flight.airlineLogo ? (
                <img 
                  src={flight.airlineLogo} 
                  alt={flight.airline}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Plane className={`w-6 h-6 text-muted-foreground ${flight.airlineLogo ? 'hidden' : ''}`} />
            </div>
            <div>
              <p className="font-medium text-sm">{flight.airline}</p>
              <p className="text-xs text-muted-foreground">{flight.flightNumber}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-8">
            <div className="text-center sm:text-left">
              <p className="text-2xl font-bold" data-testid={`text-departure-time-${flight.id}`}>
                {flight.departure.time}
              </p>
              <p className="text-sm text-muted-foreground">{flight.departure.airport}</p>
              <p className="text-xs text-muted-foreground">{flight.departure.city}</p>
            </div>

            <div className="flex-1 flex flex-col items-center px-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Clock className="w-3 h-3" />
                <span>{flight.duration}</span>
              </div>
              <div className="w-full flex items-center gap-1">
                <div className="flex-1 h-px bg-border"></div>
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                {flight.stops > 0 && (
                  <>
                    <div className="flex-1 h-px bg-border"></div>
                    <div className="w-2 h-2 rounded-full border-2 border-primary bg-background"></div>
                  </>
                )}
                <div className="flex-1 h-px bg-border"></div>
                <Plane className="w-4 h-4 text-primary rotate-90" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {flight.stops === 0 ? "Direct" : `${flight.stops} Stop${flight.stops > 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="text-center sm:text-right">
              <p className="text-2xl font-bold" data-testid={`text-arrival-time-${flight.id}`}>
                {flight.arrival.time}
              </p>
              <p className="text-sm text-muted-foreground">{flight.arrival.airport}</p>
              <p className="text-xs text-muted-foreground">{flight.arrival.city}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 min-w-[140px]">
            <div className="flex flex-wrap gap-1 justify-end">
              {flight.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {flight.baggageIncluded && (
                <Badge variant="outline" className="text-xs">
                  <Briefcase className="w-3 h-3 mr-1" />
                  Baggage
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-primary" data-testid={`text-price-${flight.id}`}>
              {formatPrice(flight.price, flight.currency)}
            </p>
            <Button onClick={handleSelectClick} data-testid={`button-select-${flight.id}`}>
              Select
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
            data-testid={`button-details-${flight.id}`}
          >
            Flight Details
            {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>

          {expanded && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium mb-1">Baggage Allowance</p>
                <p className="text-muted-foreground">Carry-on: 1 x 10kg</p>
                <p className="text-muted-foreground">
                  Checked: {flight.baggageIncluded ? "1 x 23kg included" : "Not included"}
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Fare Conditions</p>
                <p className="text-muted-foreground">Change fee: From $75</p>
                <p className="text-muted-foreground">Cancellation: From $150</p>
              </div>
              <div>
                <p className="font-medium mb-1">Aircraft</p>
                <p className="text-muted-foreground">Airbus A330-300</p>
                <p className="text-muted-foreground">In-flight entertainment included</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <BrandedFareSelector
        flight={flight}
        open={showFareSelector}
        onClose={() => setShowFareSelector(false)}
        onSelectFare={handleFareSelect}
        passengers={passengers}
      />
    </Card>
  );
}
