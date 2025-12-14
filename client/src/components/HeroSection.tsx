import FlightSearchForm, { SearchData } from "./FlightSearchForm";
import heroImage from "@assets/generated_images/airplane_over_african_landscape.png";

interface HeroSectionProps {
  onSearch?: (searchData: SearchData) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  return (
    <div className="relative min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Discover Your Next Adventure
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Search thousands of flights to destinations worldwide. 
            Best prices guaranteed with our price match promise.
          </p>
        </div>

        <div className="backdrop-blur-md bg-background/90 rounded-xl shadow-2xl">
          <FlightSearchForm onSearch={onSearch} />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/80 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Best Price Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>24/7 Customer Support</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Free Cancellation Options</span>
          </div>
        </div>
      </div>
    </div>
  );
}
