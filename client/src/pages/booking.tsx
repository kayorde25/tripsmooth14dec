import { useState, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import BookingSteps from "@/components/BookingSteps";
import FareSelection, { FareOption } from "@/components/FareSelection";
import PassengerForm, { Passenger, PassengerType } from "@/components/PassengerForm";
import AddOns, { AddOn } from "@/components/AddOns";
import CheckoutReview from "@/components/CheckoutReview";
import PaymentForm from "@/components/PaymentForm";
import BookingSummary from "@/components/BookingSummary";
import ConfirmationPage from "@/components/ConfirmationPage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { PassengerCounts } from "@/components/FlightSearchForm";

const STEPS = [
  { id: "fare", label: "Select Fare" },
  { id: "passengers", label: "Passengers" },
  { id: "addons", label: "Add-Ons" },
  { id: "checkout", label: "Checkout" },
  { id: "payment", label: "Payment" },
  { id: "confirmation", label: "Confirmation" },
];

const DEFAULT_ADDONS: AddOn[] = [
  {
    id: "insurance",
    type: "insurance",
    name: "Travel Insurance",
    description: "Comprehensive coverage for trip cancellation, medical emergencies, lost baggage, and flight delays up to $50,000.",
    price: 45,
    currency: "USD",
    selected: false,
  },
  {
    id: "baggage",
    type: "baggage",
    name: "Extra Checked Baggage",
    description: "Add additional checked bags to your booking. Weight and size restrictions apply.",
    price: 0,
    currency: "USD",
    selected: false,
    options: [
      { value: "1x23kg", label: "1 x 23kg bag", price: 35 },
      { value: "2x23kg", label: "2 x 23kg bags", price: 65 },
      { value: "1x32kg", label: "1 x 32kg bag", price: 55 },
    ],
    selectedOption: "1x23kg",
  },
  {
    id: "carbon",
    type: "carbon",
    name: "Carbon Offset",
    description: "Offset your flight's carbon emissions by supporting verified environmental projects worldwide.",
    price: 12,
    currency: "USD",
    selected: false,
  },
];

const CHILD_DISCOUNT = 0.75;
const INFANT_PRICE = 0;

interface SelectedFlight {
  id: string;
  airline: string;
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
  price: number;
  currency: string;
}

interface FareTypeResponse {
  id: string;
  name: string;
  priceMultiplier: number;
  carryOn: string;
  checkedBag: string;
  seatSelection: boolean;
  changeFee: string;
  cancellationFee: string;
  mileageAccrual: string;
}

const createPassenger = (id: string, type: PassengerType): Passenger => ({
  id,
  type,
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  nationality: "",
  documentType: "passport",
  documentNumber: "",
  documentExpiry: "",
});

const initializePassengers = (counts: PassengerCounts): Passenger[] => {
  const passengers: Passenger[] = [];
  let id = 1;
  
  for (let i = 0; i < counts.adults; i++) {
    passengers.push(createPassenger(String(id++), "adult"));
  }
  for (let i = 0; i < counts.children; i++) {
    passengers.push(createPassenger(String(id++), "child"));
  }
  for (let i = 0; i < counts.infants; i++) {
    passengers.push(createPassenger(String(id++), "infant"));
  }
  
  return passengers.length > 0 ? passengers : [createPassenger("1", "adult")];
};

export default function Booking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFareId, setSelectedFareId] = useState<string | undefined>();
  const [selectedFlight, setSelectedFlight] = useState<SelectedFlight | null>(null);
  const [bookingResult, setBookingResult] = useState<{ reference: string; id: string } | null>(null);
  const [passengerCounts, setPassengerCounts] = useState<PassengerCounts>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [passengers, setPassengers] = useState<Passenger[]>([createPassenger("1", "adult")]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [addOns, setAddOns] = useState<AddOn[]>(DEFAULT_ADDONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  const searchString = useSearch();

  const { data: paystackStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/paystack/status"],
  });

  useEffect(() => {
    const storedFlight = localStorage.getItem("selectedFlight");
    if (storedFlight) {
      setSelectedFlight(JSON.parse(storedFlight));
    }
    
    const storedCounts = localStorage.getItem("passengerCounts");
    if (storedCounts) {
      const counts: PassengerCounts = JSON.parse(storedCounts);
      setPassengerCounts(counts);
      setPassengers(initializePassengers(counts));
    }
  }, []);

  const completeBookingAfterPayment = useCallback(async (reference: string) => {
    const pendingData = localStorage.getItem("pendingBookingData");
    if (!pendingData) {
      toast({
        title: "Booking Error",
        description: "Could not find pending booking data. Please try again.",
        variant: "destructive",
      });
      setIsVerifyingPayment(false);
      return;
    }

    try {
      const bookingData = JSON.parse(pendingData);
      const response = await apiRequest("POST", "/api/paystack/complete-booking", {
        reference,
        bookingData,
      });
      const data = await response.json();

      if (data.success && data.booking) {
        localStorage.removeItem("pendingBookingData");
        localStorage.removeItem("paystackReference");
        setBookingResult({
          reference: data.booking.reference,
          id: data.booking.id,
        });
        setCurrentStep(6);
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed!",
        });
      } else {
        throw new Error(data.error || "Booking failed");
      }
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Could not complete your booking. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingPayment(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const reference = params.get("reference");
    const trxref = params.get("trxref");
    const paymentRef = reference || trxref;

    if (paymentRef && !isVerifyingPayment && !bookingResult) {
      const pendingData = localStorage.getItem("pendingBookingData");
      const storedFlight = localStorage.getItem("selectedFlight");
      
      if (!pendingData) {
        toast({
          title: "Session Expired",
          description: "Your booking session has expired. Please start again.",
          variant: "destructive",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      if (storedFlight && !selectedFlight) {
        setSelectedFlight(JSON.parse(storedFlight));
        return;
      }
      
      if (!selectedFlight) {
        return;
      }
      
      setIsVerifyingPayment(true);
      setCurrentStep(5);
      
      try {
        const bookingData = JSON.parse(pendingData);
        if (bookingData.contactEmail) setContactEmail(bookingData.contactEmail);
        if (bookingData.contactPhone) setContactPhone(bookingData.contactPhone);
        if (bookingData.passengerCounts) setPassengerCounts(bookingData.passengerCounts);
        if (bookingData.fareTypeId) setSelectedFareId(bookingData.fareTypeId);
        if (bookingData.passengers) {
          setPassengers(bookingData.passengers.map((p: any, i: number) => ({
            id: String(i + 1),
            ...p,
          })));
        }
      } catch (e) {
      }
      
      completeBookingAfterPayment(paymentRef);
    }
  }, [searchString, isVerifyingPayment, bookingResult, completeBookingAfterPayment, selectedFlight, toast]);

  const { data: fareTypesRaw = [], isLoading: loadingFares } = useQuery<FareTypeResponse[]>({
    queryKey: ["/api/fare-types"],
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return response.json();
    },
    onSuccess: (data) => {
      setBookingResult({
        reference: data.booking.reference,
        id: data.booking.id,
      });
      setCurrentStep(6);
      setIsProcessing(false);
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const fares: FareOption[] = fareTypesRaw.map((f) => ({
    id: f.id,
    name: f.name,
    price: Math.round((selectedFlight?.price || 856) * f.priceMultiplier),
    currency: selectedFlight?.currency || "USD",
    recommended: f.id === "standard",
    features: {
      carryOn: f.carryOn,
      checkedBag: f.checkedBag,
      seatSelection: f.seatSelection,
      changeFee: f.changeFee,
      cancellationFee: f.cancellationFee,
      mileageAccrual: f.mileageAccrual,
    },
  }));

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleUpdatePassenger = (id: string, field: keyof Passenger, value: string) => {
    setPassengers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleUpdateContact = (field: "email" | "phone", value: string) => {
    if (field === "email") setContactEmail(value);
    else setContactPhone(value);
  };

  const handleToggleAddOn = (id: string) => {
    setAddOns((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };

  const handleSelectAddOnOption = (id: string, option: string) => {
    setAddOns((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selectedOption: option } : a))
    );
  };

  const buildBookingData = () => {
    const passengersNeedingInsurance = passengers.filter(p => p.type !== "infant").length;
    
    const selectedAddOns = addOns
      .filter(a => a.selected)
      .map(a => ({
        id: a.id,
        type: a.type,
        name: a.name,
        price: a.options && a.selectedOption 
          ? a.options.find(o => o.value === a.selectedOption)?.price || 0
          : a.price * (a.type === "insurance" ? passengersNeedingInsurance : 1),
        currency: a.currency,
        selectedOption: a.selectedOption,
        passengerCount: a.type === "insurance" ? passengersNeedingInsurance : 1,
      }));

    return {
      flightId: selectedFlight?.id,
      fareTypeId: selectedFareId,
      contactEmail,
      contactPhone,
      passengers: passengers.map((p) => ({
        type: p.type,
        firstName: p.firstName,
        lastName: p.lastName,
        gender: p.gender,
        dateOfBirth: p.dateOfBirth,
        nationality: p.nationality,
        documentType: p.documentType,
        documentNumber: p.documentNumber,
        documentExpiry: p.documentExpiry,
      })),
      addOns: selectedAddOns,
      passengerCounts,
    };
  };

  const handlePaystackPayment = async () => {
    setIsProcessing(true);
    
    const finalAmount = totalAmount - (appliedPromo?.discount || 0);
    const bookingData = buildBookingData();

    try {
      const response = await apiRequest("POST", "/api/paystack/initialize", {
        email: contactEmail,
        amount: finalAmount,
        currency: selectedFlight?.currency || "USD",
        flightOfferId: selectedFlight?.id,
        callbackUrl: `${window.location.origin}/booking`,
      });
      
      const data = await response.json();
      
      if (data.success && data.authorizationUrl) {
        localStorage.setItem("paystackReference", data.reference);
        localStorage.setItem("pendingBookingData", JSON.stringify(bookingData));
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error(data.error || "Failed to initialize payment");
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Could not initialize payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handlePaymentSubmit = () => {
    setIsProcessing(true);
    const bookingData = buildBookingData();
    createBookingMutation.mutate(bookingData);
  };

  const selectedFare = fares.find((f) => f.id === selectedFareId);

  const passengersNeedingInsurance = passengers.filter(p => p.type !== "infant").length;
  
  const addOnFees = addOns
    .filter(a => a.selected)
    .reduce((sum, a) => {
      if (a.options && a.selectedOption) {
        const option = a.options.find(o => o.value === a.selectedOption);
        return sum + (option?.price || 0);
      }
      return sum + a.price * (a.type === "insurance" ? passengersNeedingInsurance : 1);
    }, 0);

  const basePrice = selectedFare?.price || selectedFlight?.price || 856;
  const adultFare = basePrice * passengerCounts.adults;
  const childFare = Math.round(basePrice * CHILD_DISCOUNT) * passengerCounts.children;
  const infantFare = INFANT_PRICE * passengerCounts.infants;
  const baseFare = adultFare + childFare + infantFare;
  const taxes = Math.round(baseFare * 0.12);
  const totalAmount = baseFare + taxes + addOnFees;

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!selectedFareId;
      case 1:
        return passengers.every((p) => {
          const basicInfo = p.firstName && p.lastName && p.gender && p.dateOfBirth;
          if (p.type === "infant") {
            return basicInfo;
          }
          return basicInfo && p.documentNumber;
        }) && contactEmail;
      case 2:
        return true;
      case 3:
        return termsAccepted;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!selectedFlight) {
    return (
      <div className="min-h-screen bg-background">
        <Header isDark={isDark} onToggleTheme={handleThemeToggle} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">No Flight Selected</h1>
          <p className="text-muted-foreground mb-6">Please select a flight first.</p>
          <Button onClick={() => setLocation("/flights")} data-testid="button-search-flights">
            Search Flights
          </Button>
        </div>
      </div>
    );
  }

  const generateTicketNumber = (index: number) => {
    const ref = bookingResult?.reference || "TS-XXXXXX";
    const refNum = ref.split("-")[1] || "XXXXXX";
    return `098-${refNum}-${String(index + 1).padStart(3, "0")}`;
  };

  if (currentStep === 5) {
    const passengerTickets = passengers.map((p, index) => ({
      name: `${p.firstName} ${p.lastName}`,
      ticketNumber: generateTicketNumber(index),
    }));

    return (
      <div className="min-h-screen bg-background">
        <Header isDark={isDark} onToggleTheme={handleThemeToggle} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ConfirmationPage
            bookingReference={bookingResult?.reference || "TS-XXXXXX"}
            passengerName={`${passengers[0].firstName} ${passengers[0].lastName}`}
            email={contactEmail}
            flightDetails={{
              airline: selectedFlight.airline,
              flightNumber: selectedFlight.flightNumber,
              departure: {
                city: selectedFlight.departure.city,
                airport: selectedFlight.departure.airport,
                date: selectedFlight.departure.date || "Dec 15, 2025",
                time: selectedFlight.departure.time,
              },
              arrival: {
                city: selectedFlight.arrival.city,
                airport: selectedFlight.arrival.airport,
                time: selectedFlight.arrival.time,
              },
            }}
            passengers={passengerTickets}
            onDownloadTicket={() => {
              toast({
                title: "Ticket Downloaded",
                description: "Your e-ticket has been downloaded.",
              });
            }}
            onPrint={() => window.print()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} onToggleTheme={handleThemeToggle} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingSteps steps={STEPS} currentStep={currentStep} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 0 && (
              loadingFares ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : (
                <FareSelection
                  fares={fares}
                  selectedFareId={selectedFareId}
                  onSelectFare={(fare) => setSelectedFareId(fare.id)}
                />
              )
            )}

            {currentStep === 1 && (
              <PassengerForm
                passengers={passengers}
                onUpdatePassenger={handleUpdatePassenger}
                contactEmail={contactEmail}
                contactPhone={contactPhone}
                onUpdateContact={handleUpdateContact}
              />
            )}

            {currentStep === 2 && (
              <AddOns
                addOns={addOns}
                onToggleAddOn={handleToggleAddOn}
                onSelectOption={handleSelectAddOnOption}
                passengerCount={passengersNeedingInsurance}
              />
            )}

            {currentStep === 3 && (
              <CheckoutReview
                flight={{
                  airline: selectedFlight.airline,
                  flightNumber: selectedFlight.flightNumber,
                  departure: {
                    time: selectedFlight.departure.time,
                    airport: selectedFlight.departure.airport,
                    city: selectedFlight.departure.city,
                    date: selectedFlight.departure.date || "Dec 15, 2025",
                  },
                  arrival: {
                    time: selectedFlight.arrival.time,
                    airport: selectedFlight.arrival.airport,
                    city: selectedFlight.arrival.city,
                  },
                  duration: selectedFlight.duration,
                }}
                passengers={passengers}
                passengerCounts={passengerCounts}
                fareType={selectedFare?.name || "Standard"}
                addOns={addOns}
                contactEmail={contactEmail}
                contactPhone={contactPhone}
                baseFare={baseFare}
                taxes={taxes}
                addOnFees={addOnFees}
                totalAmount={totalAmount}
                currency={selectedFlight.currency}
                termsAccepted={termsAccepted}
                onTermsChange={setTermsAccepted}
                appliedPromo={appliedPromo}
                onApplyPromo={(code, discount) => setAppliedPromo({ code, discount })}
                onRemovePromo={() => setAppliedPromo(null)}
              />
            )}

            {currentStep === 4 && (
              isVerifyingPayment ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <h2 className="text-xl font-semibold">Verifying Payment</h2>
                  <p className="text-muted-foreground text-center max-w-md">
                    Please wait while we confirm your payment and complete your booking...
                  </p>
                </div>
              ) : (
                <PaymentForm
                  totalAmount={totalAmount}
                  currency={selectedFlight.currency}
                  onSubmit={handlePaymentSubmit}
                  onPaystackPayment={handlePaystackPayment}
                  isProcessing={isProcessing}
                  promoDiscount={appliedPromo?.discount || 0}
                  paystackConfigured={paystackStatus?.configured ?? true}
                />
              )
            )}

            {currentStep < 4 && (
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={currentStep === 0}
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  data-testid="button-continue"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BookingSummary
                outboundFlight={{
                  airline: selectedFlight.airline,
                  flightNumber: selectedFlight.flightNumber,
                  departure: {
                    time: selectedFlight.departure.time,
                    airport: selectedFlight.departure.airport,
                    city: selectedFlight.departure.city,
                    date: selectedFlight.departure.date || "Dec 15, 2025",
                  },
                  arrival: {
                    time: selectedFlight.arrival.time,
                    airport: selectedFlight.arrival.airport,
                    city: selectedFlight.arrival.city,
                  },
                  duration: selectedFlight.duration,
                }}
                passengers={passengers.length}
                passengerCounts={passengerCounts}
                cabinClass="Economy"
                fareType={selectedFare?.name || "Standard"}
                baseFare={baseFare}
                adultFare={adultFare}
                childFare={childFare}
                infantFare={infantFare}
                taxes={taxes}
                addOnFees={addOnFees}
                currency={selectedFlight.currency}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
