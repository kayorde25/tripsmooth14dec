import { CheckCircle, Download, Mail, Printer, Plane, Calendar, User, Ticket, ExternalLink, Clock, MapPin, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface PassengerTicket {
  name: string;
  ticketNumber: string;
  seat?: string;
}

interface ConfirmationPageProps {
  bookingReference: string;
  passengerName: string;
  email: string;
  flightDetails: {
    airline: string;
    flightNumber: string;
    departure: { city: string; airport: string; date: string; time: string };
    arrival: { city: string; airport: string; time: string };
  };
  passengers?: PassengerTicket[];
  onDownloadTicket?: () => void;
  onPrint?: () => void;
}

export default function ConfirmationPage({
  bookingReference,
  passengerName,
  email,
  flightDetails,
  passengers = [],
  onDownloadTicket,
  onPrint,
}: ConfirmationPageProps) {
  const { toast } = useToast();

  const handleResendEmail = () => {
    toast({
      title: "Email Sent",
      description: `Confirmation email has been resent to ${email}`,
    });
  };

  const handleDownloadTicket = () => {
    const ticketContent = `
═══════════════════════════════════════════════════════════════
                      ELECTRONIC TICKET
                        TripSmooth.com
═══════════════════════════════════════════════════════════════

BOOKING REFERENCE: ${bookingReference}

PASSENGER: ${passengerName}

FLIGHT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${flightDetails.airline}  ${flightDetails.flightNumber}
Date: ${flightDetails.departure.date}

FROM: ${flightDetails.departure.city} (${flightDetails.departure.airport})
      Departure: ${flightDetails.departure.time}

TO:   ${flightDetails.arrival.city} (${flightDetails.arrival.airport})
      Arrival: ${flightDetails.arrival.time}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT INFORMATION
• Please arrive at the airport at least 2 hours before departure
• Have your passport/ID ready for check-in
• Online check-in opens 24 hours before departure
• Baggage allowance depends on your fare type

For support, visit: tripsmooth.com/support
Manage booking: tripsmooth.com/manage-booking

═══════════════════════════════════════════════════════════════
        Thank you for booking with TripSmooth.com!
═══════════════════════════════════════════════════════════════
    `;

    const blob = new Blob([ticketContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `e-ticket-${bookingReference}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "E-Ticket Downloaded",
      description: "Your e-ticket has been saved to your device.",
    });

    if (onDownloadTicket) {
      onDownloadTicket();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
        <p className="text-muted-foreground">
          Your booking has been successfully completed. A confirmation email has been sent to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
            <Mail className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-medium">Confirmation email sent</p>
              <p className="text-sm text-green-600 dark:text-green-500">Check your inbox for booking details and e-ticket</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResendEmail}
              className="text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              data-testid="button-resend-email"
            >
              <Send className="w-4 h-4 mr-1" />
              Resend
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Ticket className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Booking Reference</CardTitle>
          </div>
          <p className="text-4xl font-bold tracking-widest text-primary" data-testid="text-booking-reference">
            {bookingReference}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Keep this reference for your records</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleDownloadTicket} data-testid="button-download-ticket">
              <Download className="w-4 h-4 mr-2" />
              Download E-Ticket
            </Button>
            <Button variant="outline" onClick={onPrint} data-testid="button-print">
              <Printer className="w-4 h-4 mr-2" />
              Print Itinerary
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Flight Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium">{flightDetails.airline}</p>
              <Badge variant="secondary">{flightDetails.flightNumber}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {flightDetails.departure.date}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-2xl font-bold">{flightDetails.departure.time}</p>
              <p className="text-sm text-muted-foreground">{flightDetails.departure.airport}</p>
              <p className="text-xs text-muted-foreground">{flightDetails.departure.city}</p>
            </div>
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="w-full h-px bg-border relative">
                <Plane className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-primary rotate-90 bg-card" />
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-2xl font-bold">{flightDetails.arrival.time}</p>
              <p className="text-sm text-muted-foreground">{flightDetails.arrival.airport}</p>
              <p className="text-xs text-muted-foreground">{flightDetails.arrival.city}</p>
            </div>
          </div>

          <Separator />

          {passengers.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Passengers & Tickets
              </p>
              {passengers.map((passenger, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{passenger.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Ticket: <span className="font-mono">{passenger.ticketNumber}</span>
                      </p>
                    </div>
                  </div>
                  {passenger.seat && (
                    <Badge variant="outline" className="text-xs">
                      Seat {passenger.seat}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{passengerName}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium shrink-0">1</div>
            <div>
              <p className="font-medium">Check your email</p>
              <p className="text-muted-foreground">We've sent your e-ticket and booking details to your email.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium shrink-0">2</div>
            <div>
              <p className="font-medium">Online check-in</p>
              <p className="text-muted-foreground">Check in online 24-48 hours before your flight departure.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium shrink-0">3</div>
            <div>
              <p className="font-medium">Arrive at the airport</p>
              <p className="text-muted-foreground">Arrive at least 2-3 hours before departure for international flights.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Manage Your Booking</p>
                <p className="text-sm text-muted-foreground">View details, make changes, or download your tickets</p>
              </div>
            </div>
            <Link href="/manage-booking">
              <Button variant="outline" data-testid="button-manage-booking">
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage Booking
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link href="/">
          <Button data-testid="button-back-home">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
