import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plane, User, Users, Baby, MapPin, Calendar, Clock, Shield, Briefcase, Leaf, Tag, X, Check } from "lucide-react";
import { Passenger } from "@/components/PassengerForm";
import { AddOn } from "@/components/AddOns";
import { PassengerCounts } from "@/components/FlightSearchForm";
import { useToast } from "@/hooks/use-toast";

interface FlightInfo {
  airline: string;
  flightNumber: string;
  departure: { time: string; airport: string; city: string; date: string };
  arrival: { time: string; airport: string; city: string };
  duration: string;
}

const PROMO_CODES: Record<string, { discount: number; type: "percent" | "fixed"; description: string }> = {
  "SAVE10": { discount: 10, type: "percent", description: "10% off your booking" },
  "TRIP10": { discount: 10, type: "percent", description: "10% off your booking" },
  "SAVE50": { discount: 50, type: "fixed", description: "$50 off your booking" },
  "WELCOME15": { discount: 15, type: "percent", description: "15% off for new customers" },
  "AFRICA25": { discount: 25, type: "fixed", description: "$25 off African routes" },
};

interface CheckoutReviewProps {
  flight: FlightInfo;
  passengers: Passenger[];
  passengerCounts: PassengerCounts;
  fareType: string;
  addOns: AddOn[];
  contactEmail: string;
  contactPhone: string;
  baseFare: number;
  taxes: number;
  addOnFees: number;
  totalAmount: number;
  currency: string;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  appliedPromo?: { code: string; discount: number } | null;
  onApplyPromo?: (code: string, discount: number) => void;
  onRemovePromo?: () => void;
}

export default function CheckoutReview({
  flight,
  passengers,
  passengerCounts,
  fareType,
  addOns,
  contactEmail,
  contactPhone,
  baseFare,
  taxes,
  addOnFees,
  totalAmount,
  currency,
  termsAccepted,
  onTermsChange,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
}: CheckoutReviewProps) {
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const { toast } = useToast();

  const formatPrice = (price: number, curr: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError("Please enter a promo code");
      return;
    }

    const promo = PROMO_CODES[code];
    if (!promo) {
      setPromoError("Invalid promo code");
      toast({
        title: "Invalid Code",
        description: "The promo code you entered is not valid.",
        variant: "destructive",
      });
      return;
    }

    const discountAmount = promo.type === "percent" 
      ? Math.round(totalAmount * (promo.discount / 100))
      : promo.discount;

    if (onApplyPromo) {
      onApplyPromo(code, discountAmount);
    }
    setPromoCode("");
    setPromoError("");
    toast({
      title: "Promo Applied!",
      description: promo.description,
    });
  };

  const handleRemovePromo = () => {
    if (onRemovePromo) {
      onRemovePromo();
    }
    toast({
      title: "Promo Removed",
      description: "The promo code has been removed from your booking.",
    });
  };

  const selectedAddOns = addOns.filter(a => a.selected);
  const finalTotal = appliedPromo ? totalAmount - appliedPromo.discount : totalAmount;

  const getAddOnIcon = (type: string) => {
    switch (type) {
      case "insurance": return Shield;
      case "baggage": return Briefcase;
      case "carbon": return Leaf;
      default: return Shield;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review Your Booking</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Please review all details before proceeding to payment
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Flight Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center shrink-0">
              <Plane className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{flight.airline} {flight.flightNumber}</p>
              <p className="text-sm text-muted-foreground">{fareType}</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{flight.departure.time}</p>
              <p className="text-sm font-medium">{flight.departure.airport}</p>
              <p className="text-xs text-muted-foreground">{flight.departure.city}</p>
            </div>
            <div className="flex-1 px-6 flex flex-col items-center">
              <div className="text-xs text-muted-foreground mb-1">{flight.duration}</div>
              <div className="w-full flex items-center">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <div className="flex-1 h-px bg-border mx-2"></div>
                <Plane className="w-4 h-4 text-primary rotate-90" />
                <div className="flex-1 h-px bg-border mx-2"></div>
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Non-stop</div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{flight.arrival.time}</p>
              <p className="text-sm font-medium">{flight.arrival.airport}</p>
              <p className="text-xs text-muted-foreground">{flight.arrival.city}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{flight.departure.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{flight.duration}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Passengers ({passengers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {passengers.map((passenger, index) => (
            <div key={passenger.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
                  {passenger.type === "adult" && <User className="w-4 h-4 text-muted-foreground" />}
                  {passenger.type === "child" && <Users className="w-4 h-4 text-muted-foreground" />}
                  {passenger.type === "infant" && <Baby className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-medium">
                    {passenger.firstName} {passenger.lastName}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {passenger.type}
                    </Badge>
                    {passenger.documentNumber && (
                      <span className="text-xs text-muted-foreground">
                        {passenger.documentType}: ****{passenger.documentNumber.slice(-4)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedAddOns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Add-Ons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedAddOns.map(addon => {
              const Icon = getAddOnIcon(addon.type);
              return (
                <div key={addon.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{addon.name}</span>
                    {addon.selectedOption && (
                      <Badge variant="outline" className="text-xs">
                        {addon.options?.find(o => o.value === addon.selectedOption)?.label}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {formatPrice(
                      addon.options && addon.selectedOption
                        ? addon.options.find(o => o.value === addon.selectedOption)?.price || 0
                        : addon.price * (addon.type === "insurance" ? passengerCounts.adults + passengerCounts.children : 1),
                      currency
                    )}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span data-testid="text-contact-email">{contactEmail}</span>
          </div>
          {contactPhone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{contactPhone}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Promo Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appliedPromo ? (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-700 dark:text-green-300">{appliedPromo.code}</span>
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                  -{formatPrice(appliedPromo.discount, currency)}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemovePromo}
                className="h-8 text-muted-foreground hover:text-destructive"
                data-testid="button-remove-promo"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError("");
                }}
                className={promoError ? "border-destructive" : ""}
                data-testid="input-promo-code"
              />
              <Button 
                variant="secondary" 
                onClick={handleApplyPromo}
                data-testid="button-apply-promo"
              >
                Apply
              </Button>
            </div>
          )}
          {promoError && (
            <p className="text-sm text-destructive mt-2">{promoError}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Try: TRIP10, SAVE50, WELCOME15, or AFRICA25
          </p>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Price Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Base fare ({passengers.length} passengers)</span>
            <span>{formatPrice(baseFare, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxes & fees</span>
            <span>{formatPrice(taxes, currency)}</span>
          </div>
          {addOnFees > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Add-ons</span>
              <span>{formatPrice(addOnFees, currency)}</span>
            </div>
          )}
          {appliedPromo && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Promo discount ({appliedPromo.code})
              </span>
              <span>-{formatPrice(appliedPromo.discount, currency)}</span>
            </div>
          )}
          <Separator className="my-3" />
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">Total</span>
            <div className="text-right">
              {appliedPromo && (
                <span className="text-sm text-muted-foreground line-through mr-2">
                  {formatPrice(totalAmount, currency)}
                </span>
              )}
              <span className="font-bold text-2xl text-primary" data-testid="text-checkout-total">
                {formatPrice(finalTotal, currency)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(checked) => onTermsChange(checked === true)}
          data-testid="checkbox-terms"
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="terms"
            className="text-sm font-medium leading-relaxed cursor-pointer"
          >
            I agree to the Terms & Conditions and Privacy Policy
          </Label>
          <p className="text-xs text-muted-foreground">
            By checking this box, you confirm that all passenger details are correct and you accept
            the fare rules, baggage policies, and cancellation terms for this booking.
          </p>
        </div>
      </div>
    </div>
  );
}
