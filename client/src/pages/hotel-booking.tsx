import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle2,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface SelectedHotelData {
  hotel: {
    code: string;
    name: string;
    categoryName: string;
    destinationName: string;
    zoneName: string;
  };
  room: {
    code: string;
    name: string;
  };
  rate: {
    rateKey: string;
    net: number;
    boardName: string;
    cancellationPolicies?: Array<{ from: string; amount: string }>;
  };
  searchParams: {
    destination: string;
    checkIn: string;
    checkOut: string;
    rooms: number;
    adults: number;
    children: number;
  };
}

export default function HotelBooking() {
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [hotelData, setHotelData] = useState<SelectedHotelData | null>(null);
  const [step, setStep] = useState<"details" | "confirmed">("details");
  const [bookingRef, setBookingRef] = useState("");
  const { toast } = useToast();

  const [guestInfo, setGuestInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("selectedHotel");
    if (stored) {
      setHotelData(JSON.parse(stored));
    }
  }, []);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!hotelData) throw new Error("No hotel selected");

      const response = await apiRequest("POST", "/api/hotels/bookings", {
        holder: {
          name: guestInfo.firstName,
          surname: guestInfo.lastName,
        },
        rooms: [{
          rateKey: hotelData.rate.rateKey,
          paxes: [{
            roomId: 1,
            type: "AD",
            name: guestInfo.firstName,
            surname: guestInfo.lastName,
          }],
        }],
        clientReference: `TS-${Date.now()}`,
        remark: `Booking by ${guestInfo.email}`,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setBookingRef(data.booking?.reference || "HB-" + Date.now());
      setStep("confirmed");
      localStorage.removeItem("selectedHotel");
      toast({
        title: "Booking Confirmed!",
        description: `Your booking reference is ${data.booking?.reference}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    bookingMutation.mutate();
  };

  if (!hotelData) {
    return (
      <div className="min-h-screen bg-background">
        <Header isDark={isDark} onToggleTheme={handleThemeToggle} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Hotel Selected</h1>
          <p className="text-muted-foreground mb-4">Please search and select a hotel first</p>
          <Button onClick={() => setLocation("/hotels")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hotels
          </Button>
        </div>
      </div>
    );
  }

  const checkIn = new Date(hotelData.searchParams.checkIn);
  const checkOut = new Date(hotelData.searchParams.checkOut);
  const nights = differenceInDays(checkOut, checkIn);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-background">
        <Header isDark={isDark} onToggleTheme={handleThemeToggle} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground mb-6">Your hotel reservation has been confirmed</p>
          
          <Card className="text-left mb-6">
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Booking Reference</p>
                <p className="text-2xl font-bold text-primary">{bookingRef}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hotel</p>
                  <p className="font-medium">{hotelData.hotel.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Room</p>
                  <p className="font-medium">{hotelData.room.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-medium">{format(checkIn, "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-medium">{format(checkOut, "MMM dd, yyyy")}</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Paid</span>
                <span className="text-xl font-bold text-primary">{formatPrice(hotelData.rate.net)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => setLocation("/")}>
              Back to Home
            </Button>
            <Button onClick={() => setLocation("/hotels")}>
              Book Another Hotel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} onToggleTheme={handleThemeToggle} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/hotels")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Hotels
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Guest Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={guestInfo.firstName}
                        onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                        placeholder="John"
                        required
                        data-testid="input-guest-firstname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={guestInfo.lastName}
                        onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                        placeholder="Doe"
                        required
                        data-testid="input-guest-lastname"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                      data-testid="input-guest-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      data-testid="input-guest-phone"
                    />
                  </div>

                  <Separator className="my-6" />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={bookingMutation.isPending}
                    data-testid="button-confirm-booking"
                  >
                    {bookingMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Confirm Booking - ${formatPrice(hotelData.rate.net)}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center shrink-0">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{hotelData.hotel.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {hotelData.hotel.zoneName || hotelData.hotel.destinationName}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{format(checkIn, "MMM dd")} - {format(checkOut, "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{hotelData.searchParams.adults} adult{hotelData.searchParams.adults > 1 ? "s" : ""}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="font-medium">{hotelData.room.name}</p>
                  <Badge variant="secondary" className="mt-1">
                    {hotelData.rate.boardName}
                  </Badge>
                </div>

                {hotelData.rate.cancellationPolicies && hotelData.rate.cancellationPolicies.length > 0 && (
                  <p className="text-xs text-green-600">
                    Free cancellation before {format(new Date(hotelData.rate.cancellationPolicies[0].from), "MMM dd, yyyy")}
                  </p>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{nights} night{nights > 1 ? "s" : ""}</span>
                    <span>{formatPrice(hotelData.rate.net)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(hotelData.rate.net)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
