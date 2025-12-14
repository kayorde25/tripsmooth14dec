import { Plane, Calendar, User, Briefcase, ChevronDown, ChevronUp, Baby, Users } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PassengerCounts } from "@/components/FlightSearchForm";

interface FlightInfo {
  airline: string;
  flightNumber: string;
  departure: { time: string; airport: string; city: string; date: string };
  arrival: { time: string; airport: string; city: string };
  duration: string;
}

interface BookingSummaryProps {
  outboundFlight: FlightInfo;
  returnFlight?: FlightInfo;
  passengers: number;
  passengerCounts?: PassengerCounts;
  cabinClass: string;
  fareType: string;
  baseFare: number;
  adultFare?: number;
  childFare?: number;
  infantFare?: number;
  taxes: number;
  addOnFees?: number;
  currency: string;
}

export default function BookingSummary({
  outboundFlight,
  returnFlight,
  passengers,
  passengerCounts,
  cabinClass,
  fareType,
  baseFare,
  adultFare,
  childFare,
  infantFare,
  taxes,
  addOnFees = 0,
  currency,
}: BookingSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatPrice = (price: number, curr: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const total = baseFare + taxes + addOnFees;

  const hasMultipleTypes = passengerCounts && (
    (passengerCounts.adults > 0 && passengerCounts.children > 0) ||
    (passengerCounts.adults > 0 && passengerCounts.infants > 0) ||
    (passengerCounts.children > 0 && passengerCounts.infants > 0)
  );

  const FlightSegment = ({ flight, label }: { flight: FlightInfo; label: string }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">{label}</Badge>
        <span className="text-xs text-muted-foreground">{flight.departure.date}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center shrink-0">
          <Plane className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{flight.airline} {flight.flightNumber}</p>
          <p className="text-xs text-muted-foreground truncate">
            {flight.departure.city} to {flight.arrival.city}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="font-bold">{flight.departure.time}</p>
          <p className="text-xs text-muted-foreground">{flight.departure.airport}</p>
        </div>
        <div className="flex-1 px-4 flex flex-col items-center">
          <div className="text-xs text-muted-foreground">{flight.duration}</div>
          <div className="w-full h-px bg-border mt-1"></div>
        </div>
        <div className="text-right">
          <p className="font-bold">{flight.arrival.time}</p>
          <p className="text-xs text-muted-foreground">{flight.arrival.airport}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Booking Summary</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground"
            data-testid="button-toggle-summary"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <FlightSegment flight={outboundFlight} label="Outbound" />

          {returnFlight && (
            <>
              <Separator />
              <FlightSegment flight={returnFlight} label="Return" />
            </>
          )}

          <Separator />

          <div className="space-y-2 text-sm">
            {passengerCounts ? (
              <div className="space-y-1">
                {passengerCounts.adults > 0 && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{passengerCounts.adults} Adult{passengerCounts.adults > 1 ? "s" : ""}</span>
                  </div>
                )}
                {passengerCounts.children > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{passengerCounts.children} Child{passengerCounts.children > 1 ? "ren" : ""}</span>
                  </div>
                )}
                {passengerCounts.infants > 0 && (
                  <div className="flex items-center gap-2">
                    <Baby className="w-4 h-4 text-muted-foreground" />
                    <span>{passengerCounts.infants} Infant{passengerCounts.infants > 1 ? "s" : ""} (on lap)</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{passengers} {passengers === 1 ? "Passenger" : "Passengers"}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <span>{cabinClass} - {fareType}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            {hasMultipleTypes && adultFare !== undefined && childFare !== undefined ? (
              <>
                {passengerCounts!.adults > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Adults ({passengerCounts!.adults}x)</span>
                    <span>{formatPrice(adultFare, currency)}</span>
                  </div>
                )}
                {passengerCounts!.children > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Children ({passengerCounts!.children}x, 25% off)</span>
                    <span>{formatPrice(childFare, currency)}</span>
                  </div>
                )}
                {passengerCounts!.infants > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Infants ({passengerCounts!.infants}x, on lap)</span>
                    <span className="text-green-600 dark:text-green-400">Free</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base fare ({passengers}x)</span>
                <span>{formatPrice(baseFare, currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxes & fees</span>
              <span>{formatPrice(taxes, currency)}</span>
            </div>
            {addOnFees > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add-ons</span>
                <span>{formatPrice(addOnFees, currency)}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">Total</span>
            <span className="font-bold text-2xl text-primary" data-testid="text-booking-total">
              {formatPrice(total, currency)}
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
