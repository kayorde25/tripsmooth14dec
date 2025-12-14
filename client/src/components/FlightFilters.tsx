import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

export interface FilterState {
  stops: string[];
  airlines: string[];
  priceRange: [number, number];
  baggageIncluded: boolean;
  departureTime: string[];
}

interface FlightFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  maxPrice?: number;
}

const STOPS_OPTIONS = [
  { id: "direct", label: "Direct" },
  { id: "1stop", label: "1 Stop" },
  { id: "2plus", label: "2+ Stops" },
];

const AIRLINES = [
  "Kenya Airways",
  "Ethiopian Airlines",
  "South African Airways",
  "Egypt Air",
  "Royal Air Maroc",
];

const DEPARTURE_TIMES = [
  { id: "morning", label: "Morning (6AM - 12PM)" },
  { id: "afternoon", label: "Afternoon (12PM - 6PM)" },
  { id: "evening", label: "Evening (6PM - 12AM)" },
  { id: "night", label: "Night (12AM - 6AM)" },
];

export default function FlightFilters({ filters, onFilterChange, maxPrice = 2000 }: FlightFiltersProps) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: "stops" | "airlines" | "departureTime", value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const clearFilters = () => {
    onFilterChange({
      stops: [],
      airlines: [],
      priceRange: [0, maxPrice],
      baggageIncluded: false,
      departureTime: [],
    });
  };

  const hasActiveFilters =
    filters.stops.length > 0 ||
    filters.airlines.length > 0 ||
    filters.baggageIncluded ||
    filters.departureTime.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < maxPrice;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
              data-testid="button-clear-filters"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-3 text-sm">Stops</h4>
          <div className="space-y-2">
            {STOPS_OPTIONS.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <Checkbox
                  id={`stop-${option.id}`}
                  checked={filters.stops.includes(option.id)}
                  onCheckedChange={() => toggleArrayFilter("stops", option.id)}
                  data-testid={`checkbox-${option.id}`}
                />
                <Label htmlFor={`stop-${option.id}`} className="text-sm font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3 text-sm">Price Range</h4>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilter("priceRange", value as [number, number])}
            max={maxPrice}
            min={0}
            step={50}
            className="mb-2"
            data-testid="slider-price"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3 text-sm">Airlines</h4>
          <div className="space-y-2">
            {AIRLINES.map((airline) => (
              <div key={airline} className="flex items-center gap-2">
                <Checkbox
                  id={`airline-${airline}`}
                  checked={filters.airlines.includes(airline)}
                  onCheckedChange={() => toggleArrayFilter("airlines", airline)}
                  data-testid={`checkbox-airline-${airline.toLowerCase().replace(/\s+/g, "-")}`}
                />
                <Label htmlFor={`airline-${airline}`} className="text-sm font-normal cursor-pointer">
                  {airline}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3 text-sm">Departure Time</h4>
          <div className="space-y-2">
            {DEPARTURE_TIMES.map((time) => (
              <div key={time.id} className="flex items-center gap-2">
                <Checkbox
                  id={`time-${time.id}`}
                  checked={filters.departureTime.includes(time.id)}
                  onCheckedChange={() => toggleArrayFilter("departureTime", time.id)}
                  data-testid={`checkbox-time-${time.id}`}
                />
                <Label htmlFor={`time-${time.id}`} className="text-sm font-normal cursor-pointer">
                  {time.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Checkbox
            id="baggage-included"
            checked={filters.baggageIncluded}
            onCheckedChange={(checked) => updateFilter("baggageIncluded", !!checked)}
            data-testid="checkbox-baggage-included"
          />
          <Label htmlFor="baggage-included" className="text-sm font-normal cursor-pointer">
            Checked baggage included
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
