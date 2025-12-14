import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import HotelSearchForm, { HotelSearchData } from "@/components/HotelSearchForm";
import HotelCard, { Hotel, HotelRoom } from "@/components/HotelCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, ArrowUpDown, Filter } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function Hotels() {
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [searchParams, setSearchParams] = useState<HotelSearchData | null>(null);
  const [sortBy, setSortBy] = useState("price");
  const { toast } = useToast();

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const searchMutation = useMutation({
    mutationFn: async (data: HotelSearchData) => {
      const response = await apiRequest("POST", "/api/hotels/search", {
        destination: data.destinationCode,
        checkIn: format(data.checkIn, "yyyy-MM-dd"),
        checkOut: format(data.checkOut, "yyyy-MM-dd"),
        adults: data.adults,
        children: data.children,
        rooms: data.rooms,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setHotels(data);
      if (data.length === 0) {
        toast({
          title: "No hotels found",
          description: "Try different dates or destination",
        });
      }
    },
    onError: (error) => {
      console.error("Hotel search error:", error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Could not search hotels",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (data: HotelSearchData) => {
    setSearchParams(data);
    searchMutation.mutate(data);
  };

  const handleSelectRoom = (hotel: Hotel, room: HotelRoom, rateKey: string) => {
    const selectedRate = room.rates.find(r => r.rateKey === rateKey);
    if (!selectedRate || !searchParams) return;

    localStorage.setItem("selectedHotel", JSON.stringify({
      hotel,
      room,
      rate: selectedRate,
      searchParams: {
        ...searchParams,
        checkIn: searchParams.checkIn.toISOString(),
        checkOut: searchParams.checkOut.toISOString(),
      },
    }));
    setLocation("/hotel-booking");
  };

  const nights = searchParams 
    ? differenceInDays(searchParams.checkOut, searchParams.checkIn)
    : 3;

  const sortedHotels = [...hotels].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.minRate - b.minRate;
      case "price-desc":
        return b.minRate - a.minRate;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} onToggleTheme={handleThemeToggle} />

      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Find Hotels</h1>
              <p className="text-muted-foreground">
                Search 250,000+ hotels worldwide
              </p>
            </div>
          </div>
          <HotelSearchForm onSearch={handleSearch} isLoading={searchMutation.isPending} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {searchParams && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                Hotels in {searchParams.destination}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(searchParams.checkIn, "MMM dd")} - {format(searchParams.checkOut, "MMM dd, yyyy")} · {nights} night{nights > 1 ? "s" : ""} · {searchParams.adults} adult{searchParams.adults > 1 ? "s" : ""}
                {searchParams.children > 0 ? `, ${searchParams.children} child${searchParams.children > 1 ? "ren" : ""}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{sortedHotels.length} hotels found</Badge>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]" data-testid="select-hotel-sort">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {searchMutation.isPending ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 border rounded-lg">
                <div className="flex gap-4">
                  <Skeleton className="w-64 h-48 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              </div>
            ))
          ) : sortedHotels.length === 0 && searchParams ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hotels found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search dates or destination
              </p>
            </div>
          ) : !searchParams ? (
            <div className="text-center py-16 border rounded-lg bg-muted/50">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Search for Hotels</h3>
              <p className="text-muted-foreground">
                Enter your destination and dates to find available hotels
              </p>
            </div>
          ) : (
            sortedHotels.map((hotel) => (
              <HotelCard
                key={hotel.code}
                hotel={hotel}
                onSelect={handleSelectRoom}
                nights={nights}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
