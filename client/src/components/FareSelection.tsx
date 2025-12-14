import { Check, X, Briefcase, RefreshCw, XCircle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FareOption {
  id: string;
  name: string;
  price: number;
  currency: string;
  recommended?: boolean;
  features: {
    carryOn: string;
    checkedBag: string;
    seatSelection: boolean;
    changeFee: string;
    cancellationFee: string;
    mileageAccrual: string;
  };
}

interface FareSelectionProps {
  fares: FareOption[];
  selectedFareId?: string;
  onSelectFare: (fare: FareOption) => void;
}

export default function FareSelection({ fares, selectedFareId, onSelectFare }: FareSelectionProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Choose Your Fare</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fares.map((fare) => (
          <Card
            key={fare.id}
            className={cn(
              "cursor-pointer transition-all hover-elevate overflow-visible",
              selectedFareId === fare.id && "ring-2 ring-primary"
            )}
            onClick={() => onSelectFare(fare)}
            data-testid={`card-fare-${fare.id}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{fare.name}</CardTitle>
                {fare.recommended && (
                  <Badge className="shrink-0">
                    <Star className="w-3 h-3 mr-1" />
                    Recommended
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold text-primary" data-testid={`text-fare-price-${fare.id}`}>
                {formatPrice(fare.price, fare.currency)}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p>Carry-on: {fare.features.carryOn}</p>
                    <p className="text-muted-foreground">{fare.features.checkedBag}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {fare.features.seatSelection ? (
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={!fare.features.seatSelection ? "text-muted-foreground" : ""}>
                    Seat selection
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <RefreshCw className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>Change fee: {fare.features.changeFee}</span>
                </div>

                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>Cancellation: {fare.features.cancellationFee}</span>
                </div>
              </div>

              <Button
                className="w-full mt-4"
                variant={selectedFareId === fare.id ? "default" : "outline"}
                data-testid={`button-select-fare-${fare.id}`}
              >
                {selectedFareId === fare.id ? "Selected" : "Select"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
