import { useState } from "react";
import { User, Baby, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type PassengerType = "adult" | "child" | "infant";

export interface Passenger {
  id: string;
  type: PassengerType;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
  documentExpiry: string;
}

interface PassengerFormProps {
  passengers: Passenger[];
  onUpdatePassenger: (id: string, field: keyof Passenger, value: string) => void;
  contactEmail: string;
  contactPhone: string;
  onUpdateContact: (field: "email" | "phone", value: string) => void;
}

const NATIONALITIES = [
  "Kenya",
  "Nigeria",
  "South Africa",
  "Egypt",
  "Ethiopia",
  "Ghana",
  "Tanzania",
  "Morocco",
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "China",
  "India",
];

const getPassengerTypeLabel = (type: PassengerType): string => {
  switch (type) {
    case "adult":
      return "Adult (12+)";
    case "child":
      return "Child (2-11)";
    case "infant":
      return "Infant (under 2)";
  }
};

const getPassengerTypeColor = (type: PassengerType): string => {
  switch (type) {
    case "adult":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "child":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "infant":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  }
};

const getPassengerIcon = (type: PassengerType) => {
  if (type === "infant") {
    return <Baby className="w-5 h-5 text-primary" />;
  }
  return <User className="w-5 h-5 text-primary" />;
};

export default function PassengerForm({
  passengers,
  onUpdatePassenger,
  contactEmail,
  contactPhone,
  onUpdateContact,
}: PassengerFormProps) {
  const [expandedPassengers, setExpandedPassengers] = useState<string[]>(
    passengers.length > 0 ? [passengers[0].id] : []
  );

  const togglePassenger = (id: string) => {
    setExpandedPassengers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const adultsCount = passengers.filter(p => p.type === "adult").length;
  const childrenCount = passengers.filter(p => p.type === "child").length;
  const infantsCount = passengers.filter(p => p.type === "infant").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-semibold">Passenger Details</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {adultsCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {adultsCount} Adult{adultsCount > 1 ? "s" : ""}
            </Badge>
          )}
          {childrenCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {childrenCount} Child{childrenCount > 1 ? "ren" : ""}
            </Badge>
          )}
          {infantsCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {infantsCount} Infant{infantsCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {infantsCount > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Infants (under 2 years) travel on an adult's lap at no additional charge. Each adult can accompany a maximum of 1 infant.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {passengers.map((passenger, index) => {
          const typeIndex = passengers
            .filter(p => p.type === passenger.type)
            .findIndex(p => p.id === passenger.id) + 1;
          
          return (
            <Collapsible
              key={passenger.id}
              open={expandedPassengers.includes(passenger.id)}
              onOpenChange={() => togglePassenger(passenger.id)}
            >
              <Card data-testid={`card-passenger-${index + 1}`}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {getPassengerIcon(passenger.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">
                              {passenger.type === "adult" && `Adult ${typeIndex}`}
                              {passenger.type === "child" && `Child ${typeIndex}`}
                              {passenger.type === "infant" && `Infant ${typeIndex}`}
                              {passenger.firstName && ` - ${passenger.firstName} ${passenger.lastName}`}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${getPassengerTypeColor(passenger.type)}`}>
                              {getPassengerTypeLabel(passenger.type)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" data-testid={`button-toggle-passenger-${index + 1}`}>
                        {expandedPassengers.includes(passenger.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`firstName-${passenger.id}`}>
                          First Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`firstName-${passenger.id}`}
                          placeholder={passenger.type === "infant" ? "As on birth certificate" : "As shown on passport"}
                          value={passenger.firstName}
                          onChange={(e) => onUpdatePassenger(passenger.id, "firstName", e.target.value)}
                          data-testid={`input-firstname-${index + 1}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`lastName-${passenger.id}`}>
                          Last Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`lastName-${passenger.id}`}
                          placeholder={passenger.type === "infant" ? "As on birth certificate" : "As shown on passport"}
                          value={passenger.lastName}
                          onChange={(e) => onUpdatePassenger(passenger.id, "lastName", e.target.value)}
                          data-testid={`input-lastname-${index + 1}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`gender-${passenger.id}`}>
                          Gender <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={passenger.gender}
                          onValueChange={(value) => onUpdatePassenger(passenger.id, "gender", value)}
                        >
                          <SelectTrigger data-testid={`select-gender-${index + 1}`}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`dob-${passenger.id}`}>
                          Date of Birth <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`dob-${passenger.id}`}
                          type="date"
                          value={passenger.dateOfBirth}
                          onChange={(e) => onUpdatePassenger(passenger.id, "dateOfBirth", e.target.value)}
                          data-testid={`input-dob-${index + 1}`}
                        />
                        {passenger.type === "infant" && (
                          <p className="text-xs text-muted-foreground">
                            Must be under 2 years old on date of travel
                          </p>
                        )}
                        {passenger.type === "child" && (
                          <p className="text-xs text-muted-foreground">
                            Must be between 2-11 years old on date of travel
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`nationality-${passenger.id}`}>
                          Nationality {passenger.type !== "infant" && <span className="text-destructive">*</span>}
                        </Label>
                        <Select
                          value={passenger.nationality}
                          onValueChange={(value) => onUpdatePassenger(passenger.id, "nationality", value)}
                        >
                          <SelectTrigger data-testid={`select-nationality-${index + 1}`}>
                            <SelectValue placeholder="Select nationality" />
                          </SelectTrigger>
                          <SelectContent>
                            {NATIONALITIES.map((nat) => (
                              <SelectItem key={nat} value={nat.toLowerCase()}>
                                {nat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {passenger.type !== "infant" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor={`docType-${passenger.id}`}>
                              Document Type <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={passenger.documentType}
                              onValueChange={(value) => onUpdatePassenger(passenger.id, "documentType", value)}
                            >
                              <SelectTrigger data-testid={`select-doctype-${index + 1}`}>
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="passport">Passport</SelectItem>
                                <SelectItem value="id">National ID</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`docNumber-${passenger.id}`}>
                              Document Number <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id={`docNumber-${passenger.id}`}
                              placeholder="Enter document number"
                              value={passenger.documentNumber}
                              onChange={(e) => onUpdatePassenger(passenger.id, "documentNumber", e.target.value)}
                              data-testid={`input-docnumber-${index + 1}`}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`docExpiry-${passenger.id}`}>
                              Document Expiry <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id={`docExpiry-${passenger.id}`}
                              type="date"
                              value={passenger.documentExpiry}
                              onChange={(e) => onUpdatePassenger(passenger.id, "documentExpiry", e.target.value)}
                              data-testid={`input-docexpiry-${index + 1}`}
                            />
                          </div>
                        </>
                      )}

                      {passenger.type === "infant" && (
                        <div className="md:col-span-2">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              For international travel, infants may require a passport. Please check the requirements for your destination.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            We'll send your booking confirmation and updates here
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="your@email.com"
                value={contactEmail}
                onChange={(e) => onUpdateContact("email", e.target.value)}
                data-testid="input-contact-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={contactPhone}
                onChange={(e) => onUpdateContact("phone", e.target.value)}
                data-testid="input-contact-phone"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
