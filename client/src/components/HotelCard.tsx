import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  MapPin, 
  Star, 
  Wifi, 
  Car, 
  Utensils, 
  Waves,
  ChevronDown,
  ChevronUp,
  Check
} from "lucide-react";

export interface HotelRoom {
  code: string;
  name: string;
  rates: Array<{
    rateKey: string;
    rateType: string;
    net: number;
    sellingRate?: number;
    boardName: string;
    boardCode: string;
    rooms: number;
    adults: number;
    children: number;
    cancellationPolicies?: Array<{
      from: string;
      amount: string;
    }>;
  }>;
}

export interface Hotel {
  code: string;
  name: string;
  categoryName: string;
  destinationName: string;
  zoneName: string;
  latitude: number;
  longitude: number;
  minRate: number;
  maxRate: number;
  currency: string;
  rooms: HotelRoom[];
  images?: string[];
}

interface HotelCardProps {
  hotel: Hotel;
  onSelect: (hotel: Hotel, room: HotelRoom, rateKey: string) => void;
  nights: number;
}

export default function HotelCard({ hotel, onSelect, nights }: HotelCardProps) {
  const [showRooms, setShowRooms] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: hotel.currency || "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStarRating = (category: string): number => {
    if (category.includes("5")) return 5;
    if (category.includes("4")) return 4;
    if (category.includes("3")) return 3;
    if (category.includes("2")) return 2;
    return 3;
  };

  const stars = getStarRating(hotel.categoryName);
  const pricePerNight = hotel.minRate / nights;

  return (
    <Card className="hover-elevate overflow-visible" data-testid={`card-hotel-${hotel.code}`}>
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-64 h-48 lg:h-auto bg-muted flex items-center justify-center rounded-t-lg lg:rounded-l-lg lg:rounded-tr-none">
            <Building2 className="w-16 h-16 text-muted-foreground" />
          </div>

          <div className="flex-1 p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">{hotel.name}</h3>
                  <div className="flex">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3" />
                  <span>{hotel.zoneName || hotel.destinationName}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    <Wifi className="w-3 h-3 mr-1" />
                    Free WiFi
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Car className="w-3 h-3 mr-1" />
                    Parking
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Utensils className="w-3 h-3 mr-1" />
                    Restaurant
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Waves className="w-3 h-3 mr-1" />
                    Pool
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  {hotel.categoryName}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground">{nights} night{nights > 1 ? "s" : ""}</p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(hotel.minRate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(pricePerNight)}/night
                </p>
                <Button 
                  className="mt-2" 
                  onClick={() => setShowRooms(!showRooms)}
                  data-testid={`button-view-rooms-${hotel.code}`}
                >
                  {showRooms ? "Hide Rooms" : "View Rooms"}
                  {showRooms ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>

            {showRooms && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                {hotel.rooms.map((room) => (
                  <div key={room.code} className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">{room.name}</h4>
                    <div className="space-y-2">
                      {room.rates.slice(0, 3).map((rate, idx) => (
                        <div 
                          key={rate.rateKey} 
                          className="flex items-center justify-between p-3 bg-background rounded-md border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{rate.boardName}</span>
                              {rate.rateType === "BOOKABLE" && (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  <Check className="w-3 h-3 mr-1" />
                                  Available
                                </Badge>
                              )}
                            </div>
                            {rate.cancellationPolicies && rate.cancellationPolicies.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Free cancellation before {new Date(rate.cancellationPolicies[0].from).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <div>
                              <p className="font-bold text-primary">{formatPrice(rate.net)}</p>
                              <p className="text-xs text-muted-foreground">total</p>
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => onSelect(hotel, room, rate.rateKey)}
                              data-testid={`button-book-room-${room.code}-${idx}`}
                            >
                              Book
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
