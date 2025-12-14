import { Check, X, Briefcase, RotateCcw, CalendarX, Armchair, Utensils, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Flight } from "./FlightCard";

export interface FareOption {
  id: string;
  name: string;
  price: number;
  pricePerPerson: number;
  features: {
    personalItem: boolean;
    carryOn: boolean;
    checkedBag: boolean | string;
    seatSelection: boolean | string;
    changes: boolean | string;
    refund: boolean | string;
    priorityBoarding: boolean;
    meals: boolean | string;
    wifi: boolean | string;
  };
  popular?: boolean;
  savings?: string;
}

interface BrandedFareSelectorProps {
  flight: Flight;
  open: boolean;
  onClose: () => void;
  onSelectFare: (flight: Flight, fare: FareOption) => void;
  passengers?: number;
}

export default function BrandedFareSelector({
  flight,
  open,
  onClose,
  onSelectFare,
  passengers = 1,
}: BrandedFareSelectorProps) {
  const basePricePerPerson = flight.price;

  const fareOptions: FareOption[] = [
    {
      id: "light",
      name: "Light",
      price: basePricePerPerson * passengers,
      pricePerPerson: basePricePerPerson,
      features: {
        personalItem: true,
        carryOn: false,
        checkedBag: false,
        seatSelection: "From $15",
        changes: "From $75",
        refund: false,
        priorityBoarding: false,
        meals: false,
        wifi: false,
      },
    },
    {
      id: "standard",
      name: "Standard",
      price: Math.round(basePricePerPerson * 1.15) * passengers,
      pricePerPerson: Math.round(basePricePerPerson * 1.15),
      features: {
        personalItem: true,
        carryOn: true,
        checkedBag: "1 x 23kg",
        seatSelection: true,
        changes: "From $50",
        refund: "From $100",
        priorityBoarding: false,
        meals: "Snacks included",
        wifi: false,
      },
      popular: true,
    },
    {
      id: "flex",
      name: "Flex",
      price: Math.round(basePricePerPerson * 1.35) * passengers,
      pricePerPerson: Math.round(basePricePerPerson * 1.35),
      features: {
        personalItem: true,
        carryOn: true,
        checkedBag: "2 x 23kg",
        seatSelection: true,
        changes: true,
        refund: true,
        priorityBoarding: true,
        meals: true,
        wifi: true,
      },
      savings: "Best value for flexibility",
    },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: flight.currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const FeatureRow = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: boolean | string;
    icon: React.ElementType;
  }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium">
        {value === true ? (
          <Check className="w-5 h-5 text-green-500" />
        ) : value === false ? (
          <X className="w-5 h-5 text-muted-foreground/50" />
        ) : (
          <span className="text-muted-foreground">{value}</span>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Choose your fare</DialogTitle>
          <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{flight.airline}</span>
            <span>{flight.flightNumber}</span>
            <span>
              {flight.departure.airport} → {flight.arrival.airport}
            </span>
            <span>{flight.departure.time} - {flight.arrival.time}</span>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {fareOptions.map((fare) => (
            <div
              key={fare.id}
              className={cn(
                "relative rounded-lg border-2 p-4 transition-all",
                fare.popular
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              data-testid={`fare-option-${fare.id}`}
            >
              {fare.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}

              <div className="text-center mb-4 pt-2">
                <h3 className="text-lg font-semibold">{fare.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(fare.price)}
                  </span>
                  {passengers > 1 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatPrice(fare.pricePerPerson)} per person
                    </p>
                  )}
                </div>
                {fare.savings && (
                  <p className="text-xs text-green-600 mt-1">{fare.savings}</p>
                )}
              </div>

              <div className="space-y-0 bg-muted/30 rounded-lg p-3">
                <FeatureRow
                  label="Personal item"
                  value={fare.features.personalItem}
                  icon={Briefcase}
                />
                <FeatureRow
                  label="Carry-on bag"
                  value={fare.features.carryOn}
                  icon={Briefcase}
                />
                <FeatureRow
                  label="Checked baggage"
                  value={fare.features.checkedBag}
                  icon={Briefcase}
                />
                <FeatureRow
                  label="Seat selection"
                  value={fare.features.seatSelection}
                  icon={Armchair}
                />
                <FeatureRow
                  label="Flight changes"
                  value={fare.features.changes}
                  icon={RotateCcw}
                />
                <FeatureRow
                  label="Refundable"
                  value={fare.features.refund}
                  icon={CalendarX}
                />
                <FeatureRow
                  label="Priority boarding"
                  value={fare.features.priorityBoarding}
                  icon={Armchair}
                />
                <FeatureRow
                  label="Meals"
                  value={fare.features.meals}
                  icon={Utensils}
                />
                <FeatureRow
                  label="Wi-Fi"
                  value={fare.features.wifi}
                  icon={Wifi}
                />
              </div>

              <Button
                className="w-full mt-4"
                variant={fare.popular ? "default" : "outline"}
                onClick={() => onSelectFare(flight, fare)}
                data-testid={`button-select-fare-${fare.id}`}
              >
                Select {fare.name}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            Prices shown are for {passengers} passenger{passengers > 1 ? "s" : ""}.
            Taxes and fees included. Additional charges may apply for extras.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
