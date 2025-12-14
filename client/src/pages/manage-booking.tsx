import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Plane, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Download, 
  Printer, 
  Ticket,
  CheckCircle2,
  AlertCircle,
  Clock as ClockIcon,
  Luggage,
  ArrowRightLeft,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Check
} from "lucide-react";

interface BookingDetails {
  booking: {
    id: string;
    reference: string;
    status: string;
    totalAmount: number;
    currency: string;
    contactEmail: string;
    contactPhone: string;
    createdAt: string;
  };
  flight: {
    airline: string;
    flightNumber: string;
    departure: {
      time: string;
      airport: string;
      city: string;
      date: string;
    };
    arrival: {
      time: string;
      airport: string;
      city: string;
    };
    duration: string;
  } | null;
  fareType: string;
  passengers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    nationality: string | null;
    documentType: string;
    documentNumber: string | null;
  }>;
}

export default function ManageBooking() {
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [searchReference, setSearchReference] = useState("");
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const [showBaggageDialog, setShowBaggageDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showChangeFlightDialog, setShowChangeFlightDialog] = useState(false);
  const [selectedBaggage, setSelectedBaggage] = useState<string>("");
  const { toast } = useToast();

  const baggageOptions = [
    { id: "bag-15", name: "15kg Checked Bag", price: 35 },
    { id: "bag-23", name: "23kg Checked Bag", price: 50 },
    { id: "bag-32", name: "32kg Checked Bag", price: 75 },
    { id: "bag-extra", name: "Extra Carry-on (10kg)", price: 25 },
  ];

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const { data: bookingDetails, isLoading, isError, refetch } = useQuery<BookingDetails>({
    queryKey: ["/api/bookings", activeReference],
    enabled: !!activeReference,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchReference.trim()) {
      setActiveReference(searchReference.trim().toUpperCase());
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20"><ClockIcon className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"><AlertCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleDownloadTicket = () => {
    toast({
      title: "E-Ticket Downloaded",
      description: "Your e-ticket has been downloaded successfully.",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} onToggleTheme={handleThemeToggle} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Ticket className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Manage Your Booking</h1>
          <p className="text-muted-foreground">
            Enter your booking reference to view and manage your trip
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="reference" className="sr-only">Booking Reference</Label>
                <Input
                  id="reference"
                  placeholder="Enter booking reference (e.g., TS-ABC123)"
                  value={searchReference}
                  onChange={(e) => setSearchReference(e.target.value)}
                  className="text-center sm:text-left text-lg"
                  data-testid="input-booking-reference"
                />
              </div>
              <Button type="submit" className="sm:w-auto" data-testid="button-search-booking">
                <Search className="w-4 h-4 mr-2" />
                Find Booking
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {isError && activeReference && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Booking Not Found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find a booking with reference <strong>{activeReference}</strong>.
                Please check the reference and try again.
              </p>
              <Button variant="outline" onClick={() => setActiveReference(null)} data-testid="button-try-again">
                Try Another Reference
              </Button>
            </CardContent>
          </Card>
        )}

        {bookingDetails && (
          <div className="space-y-6" data-testid="booking-details-container">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardDescription>Booking Reference</CardDescription>
                    <CardTitle className="text-2xl" data-testid="text-booking-reference">
                      {bookingDetails.booking.reference}
                    </CardTitle>
                  </div>
                  {getStatusBadge(bookingDetails.booking.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Booked on {formatDate(bookingDetails.booking.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{bookingDetails.booking.contactEmail}</span>
                  </div>
                  {bookingDetails.booking.contactPhone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{bookingDetails.booking.contactPhone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {bookingDetails.flight && (
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
                      <p className="font-semibold">{bookingDetails.flight.airline} {bookingDetails.flight.flightNumber}</p>
                      <p className="text-sm text-muted-foreground">{bookingDetails.fareType || "Economy"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{bookingDetails.flight.departure.time}</p>
                      <p className="text-sm font-medium">{bookingDetails.flight.departure.airport}</p>
                      <p className="text-xs text-muted-foreground">{bookingDetails.flight.departure.city}</p>
                    </div>
                    <div className="flex-1 px-6 flex flex-col items-center">
                      <div className="text-xs text-muted-foreground mb-1">{bookingDetails.flight.duration}</div>
                      <div className="w-full flex items-center">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <div className="flex-1 h-px bg-border mx-2"></div>
                        <Plane className="w-4 h-4 text-primary rotate-90" />
                        <div className="flex-1 h-px bg-border mx-2"></div>
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{bookingDetails.flight.arrival.time}</p>
                      <p className="text-sm font-medium">{bookingDetails.flight.arrival.airport}</p>
                      <p className="text-xs text-muted-foreground">{bookingDetails.flight.arrival.city}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{bookingDetails.flight.departure.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{bookingDetails.flight.duration}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Passengers ({bookingDetails.passengers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookingDetails.passengers.map((passenger, index) => (
                  <div key={passenger.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {passenger.firstName} {passenger.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {passenger.gender}
                        </p>
                      </div>
                    </div>
                    {passenger.seatId && (
                      <Badge variant="outline" className="text-xs">
                        Seat {passenger.seatId.split("-").pop()}
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Total Paid</span>
                  <span className="font-bold text-2xl text-primary" data-testid="text-total-paid">
                    {formatPrice(bookingDetails.booking.totalAmount, bookingDetails.booking.currency)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleDownloadTicket} className="flex-1" data-testid="button-download-ticket">
                <Download className="w-4 h-4 mr-2" />
                Download E-Ticket
              </Button>
              <Button variant="outline" onClick={handlePrint} className="flex-1" data-testid="button-print">
                <Printer className="w-4 h-4 mr-2" />
                Print Itinerary
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Manage Your Booking</CardTitle>
                <CardDescription>Make changes to your trip</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="flex-col h-auto py-4 gap-2"
                  onClick={() => setShowChangeFlightDialog(true)}
                  data-testid="button-change-flight"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  <span className="text-xs">Change Flight</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-col h-auto py-4 gap-2"
                  onClick={() => setShowBaggageDialog(true)}
                  data-testid="button-add-baggage"
                >
                  <Luggage className="w-5 h-5" />
                  <span className="text-xs">Add Baggage</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-col h-auto py-4 gap-2 text-destructive hover:text-destructive"
                  onClick={() => setShowCancelDialog(true)}
                  data-testid="button-cancel-booking"
                >
                  <XCircle className="w-5 h-5" />
                  <span className="text-xs">Cancel</span>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Need Help?</p>
                    <p className="text-xs text-muted-foreground">
                      Contact our 24/7 support team at support@tripsmooth.com or call +1 (800) 123-4567
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
                className="text-primary"
                data-testid="button-book-another"
              >
                Book Another Flight
              </Button>
            </div>
          </div>
        )}

        {!activeReference && !isLoading && (
          <Card className="bg-muted/30">
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Find Your Booking</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Enter your booking reference above to view your trip details, 
                download your e-ticket, or make changes to your booking.
              </p>
              <p className="text-sm text-muted-foreground">
                Your booking reference can be found in your confirmation email.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showBaggageDialog} onOpenChange={setShowBaggageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Luggage className="w-5 h-5" />
              Add Extra Baggage
            </DialogTitle>
            <DialogDescription>
              Select additional baggage for your trip. Prices are per passenger per flight.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup value={selectedBaggage} onValueChange={setSelectedBaggage}>
              {baggageOptions.map((option) => (
                <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="cursor-pointer">
                      {option.name}
                    </Label>
                  </div>
                  <span className="font-semibold text-primary">${option.price}</span>
                </div>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBaggageDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedBaggage) {
                  const selected = baggageOptions.find(b => b.id === selectedBaggage);
                  toast({
                    title: "Baggage Added",
                    description: `${selected?.name} has been added to your booking. You will receive a confirmation email shortly.`,
                  });
                  setShowBaggageDialog(false);
                  setSelectedBaggage("");
                }
              }}
              disabled={!selectedBaggage}
              data-testid="button-confirm-baggage"
            >
              <Check className="w-4 h-4 mr-2" />
              Add Baggage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Refund Information</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Cancellation fee: $50 per passenger</li>
                  <li>• Refund method: Original payment method</li>
                  <li>• Processing time: 5-10 business days</li>
                </ul>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              By cancelling, you agree to our cancellation policy and associated fees.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Booking
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                toast({
                  title: "Booking Cancelled",
                  description: "Your booking has been cancelled. Refund will be processed within 5-10 business days.",
                  variant: "destructive",
                });
                setShowCancelDialog(false);
              }}
              data-testid="button-confirm-cancel"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showChangeFlightDialog} onOpenChange={setShowChangeFlightDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Change Flight
            </DialogTitle>
            <DialogDescription>
              Request a flight change for your booking. Our team will contact you with available options.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Preferred New Date</Label>
              <Input type="date" data-testid="input-new-date" />
            </div>
            <div className="space-y-2">
              <Label>Reason for Change (Optional)</Label>
              <Select>
                <SelectTrigger data-testid="select-change-reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule">Schedule conflict</SelectItem>
                  <SelectItem value="emergency">Personal emergency</SelectItem>
                  <SelectItem value="business">Business requirement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Change Fees</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Change fee: From $75 per passenger</li>
                  <li>• Fare difference may apply</li>
                  <li>• Subject to availability</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowChangeFlightDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: "Change Request Submitted",
                  description: "Our team will contact you within 24 hours with available flight options.",
                });
                setShowChangeFlightDialog(false);
              }}
              data-testid="button-submit-change"
            >
              <Check className="w-4 h-4 mr-2" />
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
