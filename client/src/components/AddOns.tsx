import { Shield, Luggage, Leaf, Check, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface AddOn {
  id: string;
  type: "insurance" | "baggage" | "carbon";
  name: string;
  description: string;
  price: number;
  currency: string;
  selected: boolean;
  options?: { value: string; label: string; price: number }[];
  selectedOption?: string;
}

interface AddOnsProps {
  addOns: AddOn[];
  onToggleAddOn: (id: string) => void;
  onSelectOption: (id: string, option: string) => void;
  passengerCount: number;
}

export default function AddOns({ addOns, onToggleAddOn, onSelectOption, passengerCount }: AddOnsProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "insurance":
        return <Shield className="w-5 h-5" />;
      case "baggage":
        return <Luggage className="w-5 h-5" />;
      case "carbon":
        return <Leaf className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case "insurance":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "baggage":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      case "carbon":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-muted";
    }
  };

  const getAddOnTotal = (addOn: AddOn): number => {
    if (addOn.options && addOn.selectedOption) {
      const option = addOn.options.find(o => o.value === addOn.selectedOption);
      return option?.price || 0;
    }
    return addOn.price * (addOn.type === "insurance" ? passengerCount : 1);
  };

  const totalAddOns = addOns
    .filter(a => a.selected)
    .reduce((sum, a) => sum + getAddOnTotal(a), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Enhance Your Trip</h2>
          <p className="text-muted-foreground text-sm">Add optional services to your booking</p>
        </div>
        {totalAddOns > 0 && (
          <Badge variant="secondary" className="text-base px-3 py-1">
            +{formatPrice(totalAddOns, "USD")}
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {addOns.map((addOn) => (
          <Card
            key={addOn.id}
            className={cn(
              "transition-all overflow-visible",
              addOn.selected && "ring-2 ring-primary"
            )}
            data-testid={`card-addon-${addOn.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={cn("p-3 rounded-lg shrink-0", getIconBgColor(addOn.type))}>
                  {getIcon(addOn.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{addOn.name}</h3>
                        {addOn.type === "insurance" && (
                          <Badge variant="outline" className="text-xs">Recommended</Badge>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5"
                              data-testid={`button-addon-info-${addOn.id}`}
                            >
                              <Info className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{addOn.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{addOn.description}</p>

                      {addOn.type === "insurance" && addOn.selected && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            <span>Trip cancellation</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            <span>Medical coverage</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            <span>Lost baggage</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            <span>Flight delays</span>
                          </div>
                        </div>
                      )}

                      {addOn.options && addOn.selected && (
                        <div className="mt-3">
                          <Select
                            value={addOn.selectedOption}
                            onValueChange={(value) => onSelectOption(addOn.id, value)}
                          >
                            <SelectTrigger className="w-full max-w-xs" data-testid={`select-addon-option-${addOn.id}`}>
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              {addOn.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label} - {formatPrice(option.price, addOn.currency)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-semibold text-lg" data-testid={`text-addon-price-${addOn.id}`}>
                        {addOn.options && addOn.selectedOption
                          ? formatPrice(addOn.options.find(o => o.value === addOn.selectedOption)?.price || 0, addOn.currency)
                          : formatPrice(addOn.price * (addOn.type === "insurance" ? passengerCount : 1), addOn.currency)}
                      </p>
                      {addOn.type === "insurance" && passengerCount > 1 && !addOn.options && (
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(addOn.price, addOn.currency)}/person
                        </p>
                      )}
                      <div className="mt-2">
                        <Switch
                          checked={addOn.selected}
                          onCheckedChange={() => onToggleAddOn(addOn.id)}
                          data-testid={`switch-addon-${addOn.id}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">You can skip this step</p>
              <p className="text-xs text-muted-foreground">Add-ons are optional and can be added later from My Trips</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
