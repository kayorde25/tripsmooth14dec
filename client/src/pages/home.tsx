import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import { SearchData } from "@/components/FlightSearchForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Shield, HeadphonesIcon, Plane } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleSearch = (searchData: SearchData) => {
    console.log("Searching flights:", searchData);
    localStorage.setItem("passengerCounts", JSON.stringify(searchData.passengers));
    setLocation("/flights");
  };

  const features = [
    {
      icon: Globe,
      title: "500+ Destinations",
      description: "Fly to over 500 destinations across Africa and worldwide",
    },
    {
      icon: Shield,
      title: "Secure Booking",
      description: "Your payment and personal data are always protected",
    },
    {
      icon: HeadphonesIcon,
      title: "24/7 Support",
      description: "Our team is available around the clock to assist you",
    },
    {
      icon: Plane,
      title: "Best Prices",
      description: "We guarantee the best prices with our price match promise",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} onToggleTheme={handleThemeToggle} />
      
      <main>
        <HeroSection onSearch={handleSearch} />

        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Book With Us?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience seamless travel booking with industry-leading features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center hover-elevate overflow-visible">
                <CardHeader>
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-16 bg-muted/50">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Popular Destinations</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore our most searched flight routes from Africa
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* todo: remove mock functionality */}
              {[
                { from: "Nairobi", to: "London", price: "$856" },
                { from: "Johannesburg", to: "Dubai", price: "$654" },
                { from: "Lagos", to: "New York", price: "$1,234" },
                { from: "Cairo", to: "Paris", price: "$478" },
                { from: "Addis Ababa", to: "Bangkok", price: "$892" },
                { from: "Casablanca", to: "Madrid", price: "$312" },
              ].map((route) => (
                <Card
                  key={`${route.from}-${route.to}`}
                  className="hover-elevate cursor-pointer overflow-visible"
                  onClick={() => setLocation("/flights")}
                  data-testid={`card-route-${route.from.toLowerCase()}-${route.to.toLowerCase()}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{route.from}</p>
                        <p className="text-sm text-muted-foreground">to {route.to}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">From</p>
                        <p className="text-xl font-bold text-primary">{route.price}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Plane className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold">TripSmooth</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2025 TripSmooth.com. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
