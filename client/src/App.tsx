import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Flights from "@/pages/flights";
import Booking from "@/pages/booking";
import Hotels from "@/pages/hotels";
import HotelBooking from "@/pages/hotel-booking";
import ManageBooking from "@/pages/manage-booking";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/flights" component={Flights} />
      <Route path="/booking" component={Booking} />
      <Route path="/hotels" component={Hotels} />
      <Route path="/hotel-booking" component={HotelBooking} />
      <Route path="/manage-booking" component={ManageBooking} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
