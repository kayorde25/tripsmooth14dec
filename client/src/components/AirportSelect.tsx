import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, MapPin, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import type { Airport } from "@shared/schema";

interface AirportSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "data-testid"?: string;
}

export function AirportSelect({ 
  value, 
  onChange, 
  placeholder = "Select airport",
  "data-testid": testId 
}: AirportSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: airports = [], isLoading } = useQuery<Airport[]>({
    queryKey: ["/api/airports"],
  });

  const selectedAirport = airports.find((airport) => airport.code === value);

  const filteredAirports = useMemo(() => {
    if (!searchQuery) {
      return airports.slice(0, 20);
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = airports.filter(airport => 
      airport.code.toLowerCase().includes(query) ||
      airport.city.toLowerCase().includes(query) ||
      airport.name.toLowerCase().includes(query) ||
      airport.country.toLowerCase().includes(query)
    );
    
    filtered.sort((a, b) => {
      const aCodeMatch = a.code.toLowerCase().startsWith(query);
      const bCodeMatch = b.code.toLowerCase().startsWith(query);
      if (aCodeMatch && !bCodeMatch) return -1;
      if (!aCodeMatch && bCodeMatch) return 1;
      
      const aCityMatch = a.city.toLowerCase().startsWith(query);
      const bCityMatch = b.city.toLowerCase().startsWith(query);
      if (aCityMatch && !bCityMatch) return -1;
      if (!aCityMatch && bCityMatch) return 1;
      
      return a.city.localeCompare(b.city);
    });
    
    return filtered.slice(0, 30);
  }, [airports, searchQuery]);

  const getDisplayText = () => {
    if (selectedAirport) {
      return `${selectedAirport.city} (${selectedAirport.code})`;
    }
    return placeholder;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start text-left font-normal"
          data-testid={testId}
        >
          <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className={cn("truncate", !selectedAirport && "text-muted-foreground")}>
            {getDisplayText()}
          </span>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Type city, airport code or country..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {isLoading ? "Loading airports..." : "No airport found. Try a different search."}
            </CommandEmpty>
            {filteredAirports.length > 0 && (
              <CommandGroup heading={searchQuery ? `Results for "${searchQuery}"` : "Popular airports"}>
                {filteredAirports.map((airport) => (
                  <CommandItem
                    key={airport.code}
                    value={airport.code}
                    onSelect={() => {
                      onChange(airport.code);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    data-testid={`airport-option-${airport.code}`}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === airport.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                        <Plane className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{airport.city}</span>
                          <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                            {airport.code}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {airport.name}, {airport.country}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
