import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, FlightWithDetails } from "./storage";
import { flightSearchSchema, bookingRequestSchema, type Flight } from "@shared/schema";
import { z } from "zod";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import * as amadeus from "./amadeus";
import * as hotelbeds from "./hotelbeds";
import * as paystack from "./paystack";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";

function transformedFlightToFlight(tf: amadeus.TransformedFlight): Flight {
  return {
    id: tf.id,
    flightNumber: tf.flightNumber,
    airlineCode: tf.airlineCode,
    departureAirport: tf.departure.airport,
    arrivalAirport: tf.arrival.airport,
    departureTime: tf.departure.time,
    arrivalTime: tf.arrival.time,
    duration: tf.duration,
    stops: tf.stops,
    stopDetails: tf.stopDetails?.join(", ") ?? null,
    basePrice: tf.price,
    currency: tf.currency,
    baggageIncluded: tf.baggageIncluded,
    availableSeats: tf.availableSeats,
    departureDate: tf.departure.date,
  };
}

async function cacheAmadeusFlights(flights: amadeus.TransformedFlight[]): Promise<void> {
  for (const tf of flights) {
    await storage.ensureAirlineExists(tf.airlineCode, tf.airline);
    const flight = transformedFlightToFlight(tf);
    await storage.cacheAmadeusFlight(flight);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await setupAuth(app);

  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/airports", async (req, res) => {
    try {
      const { q, limit } = req.query;
      let airports = await storage.getAirports();
      
      if (q && typeof q === 'string' && q.length > 0) {
        const query = q.toLowerCase();
        airports = airports.filter(airport => 
          airport.code.toLowerCase().includes(query) ||
          airport.city.toLowerCase().includes(query) ||
          airport.name.toLowerCase().includes(query) ||
          airport.country.toLowerCase().includes(query)
        );
      }
      
      const maxResults = limit ? Math.min(parseInt(limit as string) || 50, 100) : 50;
      airports = airports.slice(0, maxResults);
      
      res.json(airports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch airports" });
    }
  });

  app.get("/api/airports/:code", async (req, res) => {
    try {
      const airport = await storage.getAirport(req.params.code);
      if (!airport) {
        return res.status(404).json({ error: "Airport not found" });
      }
      res.json(airport);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch airport" });
    }
  });

  app.get("/api/airlines", async (req, res) => {
    try {
      const airlines = await storage.getAirlines();
      res.json(airlines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch airlines" });
    }
  });

  app.post("/api/flights/search", async (req, res) => {
    try {
      const searchParams = flightSearchSchema.parse(req.body);
      
      if (amadeus.isAmadeusConfigured()) {
        console.log("Searching flights via Amadeus API...");
        const amadeusFlights = await amadeus.searchFlights({
          origin: searchParams.origin,
          destination: searchParams.destination,
          departureDate: searchParams.departureDate,
          returnDate: searchParams.returnDate,
          passengers: searchParams.passengers,
          cabinClass: searchParams.cabinClass,
          tripType: searchParams.tripType,
        });
        
        const flightsWithTags = amadeus.addFlightTags(amadeusFlights);
        console.log(`Found ${flightsWithTags.length} flights from Amadeus`);
        
        await cacheAmadeusFlights(amadeusFlights);
        
        return res.json(flightsWithTags);
      }
      
      // Return error when Amadeus API is not configured
      console.log("Amadeus not configured");
      return res.status(503).json({ 
        error: "Flight search unavailable", 
        message: "Amadeus API is not configured. Please configure AMADEUS_API_KEY and AMADEUS_API_SECRET." 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid search parameters", details: error.errors });
      }
      console.error("Flight search error:", error);
      res.status(500).json({ error: "Failed to search flights", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/flights", async (req, res) => {
    try {
      const { origin, destination, date, passengers = "1" } = req.query;
      
      if (!amadeus.isAmadeusConfigured()) {
        return res.status(503).json({ 
          error: "Flight search unavailable", 
          message: "Amadeus API is not configured." 
        });
      }
      
      if (!origin || !destination || !date) {
        return res.status(400).json({ error: "Missing required parameters: origin, destination, date" });
      }
      
      const amadeusFlights = await amadeus.searchFlights({
        origin: origin as string,
        destination: destination as string,
        departureDate: date as string,
        passengers: parseInt(passengers as string) || 1,
        cabinClass: "economy",
        tripType: "one-way",
      });
      
      const flightsWithTags = amadeus.addFlightTags(amadeusFlights);
      
      await cacheAmadeusFlights(amadeusFlights);
      
      res.json(flightsWithTags);
    } catch (error) {
      console.error("Flight fetch error:", error);
      res.status(500).json({ error: "Failed to fetch flights", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/flights/:id", async (req, res) => {
    try {
      const flightDetails = await storage.getFlightWithDetails(req.params.id);
      if (!flightDetails) {
        return res.status(404).json({ error: "Flight not found" });
      }
      
      res.json({
        id: flightDetails.id,
        airline: flightDetails.airline.name,
        flightNumber: flightDetails.flightNumber,
        departure: {
          time: flightDetails.departureTime,
          airport: flightDetails.departureAirport,
          city: flightDetails.departureAirportInfo.city,
          date: flightDetails.departureDate,
        },
        arrival: {
          time: flightDetails.arrivalTime,
          airport: flightDetails.arrivalAirport,
          city: flightDetails.arrivalAirportInfo.city,
        },
        duration: flightDetails.duration,
        stops: flightDetails.stops,
        stopDetails: flightDetails.stopDetails,
        price: flightDetails.basePrice,
        currency: flightDetails.currency,
        baggageIncluded: flightDetails.baggageIncluded,
        availableSeats: flightDetails.availableSeats,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flight details" });
    }
  });

  app.get("/api/fare-types", async (req, res) => {
    try {
      const fareTypes = await storage.getFareTypes();
      res.json(fareTypes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fare types" });
    }
  });

  app.get("/api/flights/:flightId/seats", async (req, res) => {
    try {
      const seats = await storage.getSeatsForFlight(req.params.flightId);
      res.json(seats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch seats" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = bookingRequestSchema.parse(req.body);
      
      const flight = await storage.getFlight(bookingData.flightId);
      if (!flight) {
        return res.status(404).json({ error: "Flight not found" });
      }
      
      const fareType = await storage.getFareType(bookingData.fareTypeId);
      if (!fareType) {
        return res.status(404).json({ error: "Fare type not found" });
      }
      
      let seatFees = 0;
      if (bookingData.selectedSeats && bookingData.selectedSeats.length > 0) {
        for (const seatId of bookingData.selectedSeats) {
          const seat = await storage.getSeat(seatId);
          if (seat) {
            seatFees += seat.price;
          }
        }
      }
      
      const baseAmount = flight.basePrice * fareType.priceMultiplier * bookingData.passengers.length;
      const taxes = Math.round(baseAmount * 0.12);
      const totalAmount = baseAmount + taxes + seatFees;
      
      const booking = await storage.createBooking({
        flightId: bookingData.flightId,
        fareTypeId: bookingData.fareTypeId,
        contactEmail: bookingData.contactEmail,
        contactPhone: bookingData.contactPhone,
        totalAmount,
        currency: flight.currency,
        status: "pending",
      });
      
      const createdPassengers = [];
      for (let i = 0; i < bookingData.passengers.length; i++) {
        const passengerData = bookingData.passengers[i];
        const seatId = bookingData.selectedSeats?.[i];
        
        const passenger = await storage.createPassenger({
          bookingId: booking.id,
          firstName: passengerData.firstName,
          lastName: passengerData.lastName,
          gender: passengerData.gender,
          dateOfBirth: passengerData.dateOfBirth,
          nationality: passengerData.nationality,
          documentType: passengerData.documentType,
          documentNumber: passengerData.documentNumber,
          documentExpiry: passengerData.documentExpiry,
          seatId: seatId,
        });
        
        if (seatId) {
          await storage.updateSeatOccupied(seatId, true);
        }
        
        createdPassengers.push(passenger);
      }
      
      res.status(201).json({
        booking: {
          id: booking.id,
          reference: booking.reference,
          status: booking.status,
          totalAmount: booking.totalAmount,
          currency: booking.currency,
        },
        passengers: createdPassengers,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid booking data", details: error.errors });
      }
      console.error("Booking error:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.get("/api/bookings", isAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:reference", async (req, res) => {
    try {
      const booking = await storage.getBookingByReference(req.params.reference);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      const flight = await storage.getFlightWithDetails(booking.flightId);
      const passengers = await storage.getPassengersForBooking(booking.id);
      const fareType = await storage.getFareType(booking.fareTypeId);
      
      res.json({
        booking: {
          id: booking.id,
          reference: booking.reference,
          status: booking.status,
          totalAmount: booking.totalAmount,
          currency: booking.currency,
          contactEmail: booking.contactEmail,
          contactPhone: booking.contactPhone,
          createdAt: booking.createdAt,
        },
        flight: flight ? {
          airline: flight.airline.name,
          flightNumber: flight.flightNumber,
          departure: {
            time: flight.departureTime,
            airport: flight.departureAirport,
            city: flight.departureAirportInfo.city,
            date: flight.departureDate,
          },
          arrival: {
            time: flight.arrivalTime,
            airport: flight.arrivalAirport,
            city: flight.arrivalAirportInfo.city,
          },
          duration: flight.duration,
        } : null,
        fareType: fareType?.name,
        passengers,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  app.patch("/api/bookings/:id/payment", isAdmin, async (req, res) => {
    try {
      const { paymentMethod, paymentId } = req.body;
      
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      await storage.updateBookingStatus(req.params.id, "confirmed", paymentId);
      
      const updatedBooking = await storage.getBooking(req.params.id);
      
      res.json({
        success: true,
        booking: {
          id: updatedBooking?.id,
          reference: updatedBooking?.reference,
          status: updatedBooking?.status,
        },
      });
    } catch (error) {
      console.error("Payment update error:", error);
      res.status(500).json({ error: "Failed to update payment" });
    }
  });

  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // ============================================
  // Paystack Payment API
  // ============================================
  app.get("/api/paystack/status", async (req, res) => {
    res.json({ configured: paystack.isPaystackConfigured() });
  });

  app.post("/api/paystack/initialize", async (req, res) => {
    try {
      if (!paystack.isPaystackConfigured()) {
        return res.status(503).json({
          error: "Paystack not configured",
          message: "Please add your PAYSTACK_SECRET_KEY.",
        });
      }

      const { email, amount, currency, flightOfferId, callbackUrl, metadata } = req.body;

      if (!email || !amount) {
        return res.status(400).json({ error: "email and amount are required" });
      }

      const amountInNGN = paystack.convertCurrency(amount, currency || 'USD');
      const reference = paystack.generateReference();

      const result = await paystack.initializeTransaction({
        email,
        amount: amountInNGN,
        currency: 'NGN',
        reference,
        callbackUrl,
        metadata: {
          ...metadata,
          flightOfferId,
          originalAmount: amount,
          originalCurrency: currency,
        },
      });

      res.json({
        success: true,
        authorizationUrl: result.data.authorization_url,
        accessCode: result.data.access_code,
        reference: result.data.reference,
      });
    } catch (error) {
      console.error("Paystack initialize error:", error);
      res.status(500).json({
        error: "Failed to initialize payment",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/paystack/verify/:reference", async (req, res) => {
    try {
      if (!paystack.isPaystackConfigured()) {
        return res.status(503).json({ error: "Paystack not configured" });
      }

      const result = await paystack.verifyTransaction(req.params.reference);

      if (result.data.status === 'success') {
        res.json({
          success: true,
          verified: true,
          status: result.data.status,
          amount: result.data.amount / 100,
          currency: result.data.currency,
          reference: result.data.reference,
          paidAt: result.data.paid_at,
          customer: result.data.customer,
          metadata: result.data.metadata,
        });
      } else {
        res.json({
          success: false,
          verified: false,
          status: result.data.status,
          message: result.data.gateway_response,
        });
      }
    } catch (error) {
      console.error("Paystack verify error:", error);
      res.status(500).json({
        error: "Failed to verify payment",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/paystack/complete-booking", async (req, res) => {
    try {
      const { reference, flightOfferId, travelers, bookingData } = req.body;

      if (!reference) {
        return res.status(400).json({ error: "Payment reference is required" });
      }

      if (paystack.isPaystackConfigured()) {
        const verifyResult = await paystack.verifyTransaction(reference);
        if (verifyResult.data.status !== 'success') {
          return res.status(400).json({
            error: "Payment not successful",
            status: verifyResult.data.status,
          });
        }
      }

      let amadeusOrder = null;
      if (amadeus.isAmadeusConfigured() && flightOfferId && travelers) {
        const cachedOffer = amadeus.getCachedFlightOffer(flightOfferId);
        if (cachedOffer) {
          try {
            const pricingResult = await amadeus.priceFlightOffer(cachedOffer);
            const pricedOffer = pricingResult.flightOffers[0];

            if (pricedOffer) {
              amadeusOrder = await amadeus.createFlightOrder({
                flightOffer: pricedOffer,
                travelers,
              });
            }
          } catch (orderError) {
            console.error("Amadeus order creation failed:", orderError);
          }
        }
      }

      if (bookingData) {
        const flight = await storage.getFlight(bookingData.flightId);
        const fareType = await storage.getFareType(bookingData.fareTypeId);

        if (flight && fareType) {
          let seatFees = 0;
          if (bookingData.selectedSeats?.length > 0) {
            for (const seatId of bookingData.selectedSeats) {
              const seat = await storage.getSeat(seatId);
              if (seat) seatFees += seat.price;
            }
          }

          const baseAmount = flight.basePrice * fareType.priceMultiplier * bookingData.passengers.length;
          const taxes = Math.round(baseAmount * 0.12);
          const totalAmount = baseAmount + taxes + seatFees;

          const booking = await storage.createBooking({
            flightId: bookingData.flightId,
            fareTypeId: bookingData.fareTypeId,
            contactEmail: bookingData.contactEmail,
            contactPhone: bookingData.contactPhone,
            totalAmount,
            currency: flight.currency,
            status: "confirmed",
          });

          for (let i = 0; i < bookingData.passengers.length; i++) {
            const p = bookingData.passengers[i];
            const seatId = bookingData.selectedSeats?.[i];

            await storage.createPassenger({
              bookingId: booking.id,
              firstName: p.firstName,
              lastName: p.lastName,
              gender: p.gender,
              dateOfBirth: p.dateOfBirth,
              nationality: p.nationality,
              documentType: p.documentType,
              documentNumber: p.documentNumber,
              documentExpiry: p.documentExpiry,
              seatId,
            });

            if (seatId) {
              await storage.updateSeatOccupied(seatId, true);
            }
          }

          return res.status(201).json({
            success: true,
            booking: {
              id: booking.id,
              reference: booking.reference,
              status: booking.status,
            },
            amadeusOrder: amadeusOrder ? {
              id: amadeusOrder.id,
              pnr: amadeusOrder.associatedRecords?.[0]?.reference,
            } : null,
            paymentReference: reference,
          });
        }
      }

      res.status(201).json({
        success: true,
        amadeusOrder: amadeusOrder ? {
          id: amadeusOrder.id,
          pnr: amadeusOrder.associatedRecords?.[0]?.reference,
        } : null,
        paymentReference: reference,
      });
    } catch (error) {
      console.error("Complete booking error:", error);
      res.status(500).json({
        error: "Failed to complete booking",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============================================
  // Amadeus Flight Pricing API
  // ============================================
  app.post("/api/flights/price", async (req, res) => {
    try {
      if (!amadeus.isAmadeusConfigured()) {
        return res.status(503).json({ 
          error: "Amadeus API not configured",
          message: "Please add your Amadeus API credentials." 
        });
      }

      const { flightOfferId, paymentBrand } = req.body;

      if (!flightOfferId) {
        return res.status(400).json({ error: "flightOfferId is required" });
      }

      const cachedOffer = amadeus.getCachedFlightOffer(flightOfferId);
      if (!cachedOffer) {
        return res.status(404).json({ error: "Flight offer not found. Please search again." });
      }

      const pricingResult = await amadeus.priceFlightOffer(cachedOffer, paymentBrand);
      
      res.json({
        success: true,
        flightOffers: pricingResult.flightOffers,
        payments: pricingResult.payments,
      });
    } catch (error) {
      console.error("Flight pricing error:", error);
      res.status(500).json({ 
        error: "Failed to price flight", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ============================================
  // Amadeus Create Flight Order API
  // ============================================
  app.post("/api/amadeus/orders", async (req, res) => {
    try {
      if (!amadeus.isAmadeusConfigured()) {
        return res.status(503).json({ 
          error: "Amadeus API not configured",
          message: "Please add your Amadeus API credentials." 
        });
      }

      const { flightOfferId, travelers, remarks, ticketingAgreement, contacts } = req.body;

      if (!flightOfferId || !travelers || travelers.length === 0) {
        return res.status(400).json({ error: "flightOfferId and travelers are required" });
      }

      const cachedOffer = amadeus.getCachedFlightOffer(flightOfferId);
      if (!cachedOffer) {
        return res.status(404).json({ error: "Flight offer not found. Please search again." });
      }

      const pricingResult = await amadeus.priceFlightOffer(cachedOffer);
      const pricedOffer = pricingResult.flightOffers[0];

      if (!pricedOffer) {
        return res.status(400).json({ error: "Flight no longer available at this price" });
      }

      const orderResult = await amadeus.createFlightOrder({
        flightOffer: pricedOffer,
        travelers,
        remarks,
        ticketingAgreement,
        contacts,
      });

      res.status(201).json({
        success: true,
        order: orderResult,
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ 
        error: "Failed to create order", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ============================================
  // Amadeus Get Flight Order by Reference (PNR)
  // Must be defined BEFORE /:orderId route
  // ============================================
  app.get("/api/amadeus/orders/by-reference", async (req, res) => {
    try {
      if (!amadeus.isAmadeusConfigured()) {
        return res.status(503).json({ error: "Amadeus API not configured" });
      }

      const { reference, originSystemCode } = req.query;
      
      if (!reference || typeof reference !== 'string') {
        return res.status(400).json({ error: "reference query parameter is required" });
      }

      const order = await amadeus.getFlightOrderByReference(
        reference,
        (originSystemCode as string) || 'GDS'
      );
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json({ success: true, order });
    } catch (error) {
      console.error("Get order by reference error:", error);
      res.status(500).json({ 
        error: "Failed to get order by reference", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ============================================
  // Amadeus Get Flight Order API
  // ============================================
  app.get("/api/amadeus/orders/:orderId", async (req, res) => {
    try {
      if (!amadeus.isAmadeusConfigured()) {
        return res.status(503).json({ error: "Amadeus API not configured" });
      }

      const order = await amadeus.getFlightOrder(req.params.orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json({ success: true, order });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ 
        error: "Failed to get order", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ============================================
  // Amadeus Cancel Flight Order API
  // ============================================
  app.delete("/api/amadeus/orders/:orderId", async (req, res) => {
    try {
      if (!amadeus.isAmadeusConfigured()) {
        return res.status(503).json({ error: "Amadeus API not configured" });
      }

      await amadeus.cancelFlightOrder(req.params.orderId);
      
      res.json({ success: true, message: "Order cancelled successfully" });
    } catch (error) {
      console.error("Cancel order error:", error);
      res.status(500).json({ 
        error: "Failed to cancel order", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ============================================
  // Amadeus Add Seats to Order API
  // ============================================
  app.post("/api/amadeus/orders/:orderId/seats", async (req, res) => {
    try {
      if (!amadeus.isAmadeusConfigured()) {
        return res.status(503).json({ error: "Amadeus API not configured" });
      }

      const { travelerSeats, remarks } = req.body;
      
      if (!travelerSeats || !Array.isArray(travelerSeats)) {
        return res.status(400).json({ error: "travelerSeats array is required" });
      }

      const result = await amadeus.addSeatsToOrder({
        orderId: req.params.orderId,
        travelerSeats,
        remarks,
      });

      res.json({ success: true, order: result });
    } catch (error) {
      console.error("Add seats error:", error);
      res.status(500).json({ 
        error: "Failed to add seats", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ============================================
  // Amadeus Update Travelers API
  // ============================================
  app.post("/api/amadeus/orders/:orderId/travelers", async (req, res) => {
    try {
      if (!amadeus.isAmadeusConfigured()) {
        return res.status(503).json({ error: "Amadeus API not configured" });
      }

      const { travelers, automatedProcess, remarks } = req.body;
      
      if (!travelers || !Array.isArray(travelers)) {
        return res.status(400).json({ error: "travelers array is required" });
      }

      const result = await amadeus.updateOrderTravelers({
        orderId: req.params.orderId,
        travelers,
        automatedProcess,
        remarks,
      });

      res.json({ success: true, order: result });
    } catch (error) {
      console.error("Update travelers error:", error);
      res.status(500).json({ 
        error: "Failed to update travelers", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ============================================
  // Amadeus Add Commissions API
  // ============================================
  app.post("/api/amadeus/orders/:orderId/commissions", async (req, res) => {
    try {
      if (!amadeus.isAmadeusConfigured()) {
        return res.status(503).json({ error: "Amadeus API not configured" });
      }

      const { commissions } = req.body;
      
      if (!commissions || !Array.isArray(commissions)) {
        return res.status(400).json({ error: "commissions array is required" });
      }

      const result = await amadeus.addOrderCommissions({
        orderId: req.params.orderId,
        commissions,
      });

      res.json({ success: true, order: result });
    } catch (error) {
      console.error("Add commissions error:", error);
      res.status(500).json({ 
        error: "Failed to add commissions", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ============================================
  // Hotelbeds Hotel API Routes
  // ============================================

  app.get("/api/hotels/status", async (req, res) => {
    try {
      const configured = hotelbeds.isHotelbedsConfigured();
      if (!configured) {
        return res.json({ configured: false, status: "not_configured" });
      }
      const status = await hotelbeds.checkApiStatus();
      res.json({ configured: true, status: status ? "ok" : "error" });
    } catch (error) {
      res.status(500).json({ error: "Failed to check hotel API status" });
    }
  });

  app.get("/api/hotels/destinations", async (req, res) => {
    res.json(hotelbeds.DESTINATION_CODES);
  });

  app.post("/api/hotels/search", async (req, res) => {
    try {
      if (!hotelbeds.isHotelbedsConfigured()) {
        return res.status(503).json({ 
          error: "Hotel search unavailable", 
          message: "Hotelbeds API is not configured. Please add your API credentials." 
        });
      }

      const { checkIn, checkOut, destination, adults, children, rooms } = req.body;

      if (!checkIn || !checkOut || !destination) {
        return res.status(400).json({ error: "checkIn, checkOut, and destination are required" });
      }

      const hotels = await hotelbeds.searchHotels({
        checkIn,
        checkOut,
        destination,
        adults: adults || 2,
        children: children || 0,
        rooms: rooms || 1,
      });

      res.json(hotels);
    } catch (error) {
      console.error("Hotel search error:", error);
      res.status(500).json({ 
        error: "Failed to search hotels", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/hotels/checkrates", async (req, res) => {
    try {
      if (!hotelbeds.isHotelbedsConfigured()) {
        return res.status(503).json({ error: "Hotelbeds API not configured" });
      }

      const { rooms } = req.body;

      if (!rooms || !Array.isArray(rooms)) {
        return res.status(400).json({ error: "rooms array with rateKey is required" });
      }

      const result = await hotelbeds.checkRates({ rooms });
      res.json(result);
    } catch (error) {
      console.error("Check rates error:", error);
      res.status(500).json({ 
        error: "Failed to check rates", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/hotels/bookings", async (req, res) => {
    try {
      if (!hotelbeds.isHotelbedsConfigured()) {
        return res.status(503).json({ error: "Hotelbeds API not configured" });
      }

      const { holder, rooms, clientReference, remark } = req.body;

      if (!holder || !rooms) {
        return res.status(400).json({ error: "holder and rooms are required" });
      }

      const booking = await hotelbeds.createBooking({
        holder,
        rooms,
        clientReference: clientReference || `TS-${Date.now()}`,
        remark,
      });

      res.json({ success: true, booking });
    } catch (error) {
      console.error("Hotel booking error:", error);
      res.status(500).json({ 
        error: "Failed to create hotel booking", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/hotels/bookings/:reference", async (req, res) => {
    try {
      if (!hotelbeds.isHotelbedsConfigured()) {
        return res.status(503).json({ error: "Hotelbeds API not configured" });
      }

      const booking = await hotelbeds.getBooking(req.params.reference);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.json({ success: true, booking });
    } catch (error) {
      console.error("Get hotel booking error:", error);
      res.status(500).json({ 
        error: "Failed to get hotel booking", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.delete("/api/hotels/bookings/:reference", async (req, res) => {
    try {
      if (!hotelbeds.isHotelbedsConfigured()) {
        return res.status(503).json({ error: "Hotelbeds API not configured" });
      }

      const success = await hotelbeds.cancelBooking(req.params.reference);
      res.json({ success });
    } catch (error) {
      console.error("Cancel hotel booking error:", error);
      res.status(500).json({ 
        error: "Failed to cancel hotel booking", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ==========================================
  // CONTENT API ROUTES - Static Hotel Data
  // ==========================================

  app.get("/api/hotels/content", async (req, res) => {
    try {
      if (!hotelbeds.isHotelbedsConfigured()) {
        return res.status(503).json({ error: "Hotelbeds API not configured" });
      }

      const params: hotelbeds.HotelListParams = {
        destinationCode: req.query.destinationCode as string,
        countryCode: req.query.countryCode as string,
        language: (req.query.language as string) || 'ENG',
        from: req.query.from ? parseInt(req.query.from as string) : 1,
        to: req.query.to ? parseInt(req.query.to as string) : 100,
      };

      if (req.query.codes) {
        params.codes = (req.query.codes as string).split(',').map(Number);
      }

      const result = await hotelbeds.getHotels(params);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Get hotel content error:", error);
      res.status(500).json({ 
        error: "Failed to get hotel content", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/hotels/content/:codes/details", async (req, res) => {
    try {
      if (!hotelbeds.isHotelbedsConfigured()) {
        return res.status(503).json({ error: "Hotelbeds API not configured" });
      }

      const codes = req.params.codes.split(',').map(Number);
      const language = (req.query.language as string) || 'ENG';

      const hotels = await hotelbeds.getHotelDetails(codes, language);
      
      // Add full image URLs
      const hotelsWithImages = hotels.map((hotel: any) => ({
        ...hotel,
        images: hotel.images?.map((img: any) => ({
          ...img,
          urls: hotelbeds.getHotelImageUrls(img.path),
        })) || [],
      }));

      res.json({ success: true, hotels: hotelsWithImages });
    } catch (error) {
      console.error("Get hotel details error:", error);
      res.status(500).json({ 
        error: "Failed to get hotel details", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/hotels/content/destinations", async (req, res) => {
    try {
      if (!hotelbeds.isHotelbedsConfigured()) {
        return res.status(503).json({ error: "Hotelbeds API not configured" });
      }

      const params: hotelbeds.DestinationsParams = {
        language: (req.query.language as string) || 'ENG',
        from: req.query.from ? parseInt(req.query.from as string) : 1,
        to: req.query.to ? parseInt(req.query.to as string) : 1000,
      };

      if (req.query.codes) {
        params.codes = (req.query.codes as string).split(',');
      }
      if (req.query.countryCodes) {
        params.countryCodes = (req.query.countryCodes as string).split(',');
      }

      const result = await hotelbeds.getDestinations(params);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Get destinations error:", error);
      res.status(500).json({ 
        error: "Failed to get destinations", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/hotels/content/countries", async (req, res) => {
    try {
      if (!hotelbeds.isHotelbedsConfigured()) {
        return res.status(503).json({ error: "Hotelbeds API not configured" });
      }

      const params: hotelbeds.CountriesParams = {
        language: (req.query.language as string) || 'ENG',
        from: req.query.from ? parseInt(req.query.from as string) : 1,
        to: req.query.to ? parseInt(req.query.to as string) : 300,
      };

      if (req.query.codes) {
        params.codes = (req.query.codes as string).split(',');
      }

      const result = await hotelbeds.getCountries(params);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Get countries error:", error);
      res.status(500).json({ 
        error: "Failed to get countries", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/hotels/content/types/:typeEndpoint", async (req, res) => {
    try {
      if (!hotelbeds.isHotelbedsConfigured()) {
        return res.status(503).json({ error: "Hotelbeds API not configured" });
      }

      const { typeEndpoint } = req.params;
      const typeGetters: Record<string, (params?: hotelbeds.TypesParams) => Promise<hotelbeds.TypesResult>> = {
        accommodations: hotelbeds.getAccommodations,
        boards: hotelbeds.getBoards,
        categories: hotelbeds.getCategories,
        chains: hotelbeds.getChains,
        currencies: hotelbeds.getCurrencies,
        facilities: hotelbeds.getFacilities,
        facilitygroups: hotelbeds.getFacilityGroups,
        facilitytypologies: hotelbeds.getFacilityTypologies,
        imagetypes: hotelbeds.getImageTypes,
        issues: hotelbeds.getIssues,
        languages: hotelbeds.getLanguages,
        promotions: hotelbeds.getPromotions,
        rooms: hotelbeds.getRoomTypes,
        segments: hotelbeds.getSegments,
        terminals: hotelbeds.getTerminals,
        ratecomments: hotelbeds.getRateComments,
      };

      const getter = typeGetters[typeEndpoint];
      if (!getter) {
        return res.status(400).json({ error: `Unknown type endpoint: ${typeEndpoint}` });
      }

      const params: hotelbeds.TypesParams = {
        language: (req.query.language as string) || 'ENG',
        from: req.query.from ? parseInt(req.query.from as string) : 1,
        to: req.query.to ? parseInt(req.query.to as string) : 1000,
      };

      const result = await getter(params);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Get types error:", error);
      res.status(500).json({ 
        error: "Failed to get types", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Image URL helper endpoint
  app.get("/api/hotels/image-url", (req, res) => {
    const { path: imagePath, size } = req.query;
    
    if (!imagePath) {
      return res.status(400).json({ error: "Image path is required" });
    }

    const imageSize = (size as hotelbeds.ImageSize) || 'standard';
    const url = hotelbeds.getHotelImageUrl(imagePath as string, imageSize);
    const allUrls = hotelbeds.getHotelImageUrls(imagePath as string);

    res.json({ success: true, url, allSizes: allUrls });
  });

  // ==========================================
  // CACHE API ROUTES - Bulk Data Access
  // ==========================================

  app.get("/api/hotels/cache/fullrates", async (req, res) => {
    try {
      if (!hotelbeds.isCacheApiConfigured()) {
        return res.status(503).json({ 
          error: "Cache API not configured",
          message: "Required secrets: HOTELBEDS_API_KEY, HOTELBEDS_CACHE_USERNAME, HOTELBEDS_CACHE_PASSWORD"
        });
      }

      const result = await hotelbeds.getFullRates();
      
      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      if (result.data) {
        res.setHeader('Content-Type', 'application/zip');
        if (result.version) {
          res.setHeader('X-Version', result.version);
        }
        res.send(Buffer.from(result.data));
      } else {
        res.json({ success: true, message: result.message, version: result.version });
      }
    } catch (error) {
      console.error("Get full rates error:", error);
      res.status(500).json({ 
        error: "Failed to get full rates", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/hotels/cache/updaterates", async (req, res) => {
    try {
      if (!hotelbeds.isCacheApiConfigured()) {
        return res.status(503).json({ 
          error: "Cache API not configured",
          message: "Required secrets: HOTELBEDS_API_KEY, HOTELBEDS_CACHE_USERNAME, HOTELBEDS_CACHE_PASSWORD"
        });
      }

      const result = await hotelbeds.getUpdateRates();
      
      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      if (result.data) {
        res.setHeader('Content-Type', 'application/zip');
        if (result.version) {
          res.setHeader('X-Version', result.version);
        }
        res.send(Buffer.from(result.data));
      } else {
        res.json({ success: true, message: result.message, version: result.version });
      }
    } catch (error) {
      console.error("Get update rates error:", error);
      res.status(500).json({ 
        error: "Failed to get update rates", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/hotels/cache/confirm", async (req, res) => {
    try {
      if (!hotelbeds.isCacheApiConfigured()) {
        return res.status(503).json({ 
          error: "Cache API not configured",
          message: "Required secrets: HOTELBEDS_API_KEY, HOTELBEDS_CACHE_USERNAME, HOTELBEDS_CACHE_PASSWORD"
        });
      }

      const { version } = req.body;
      
      if (!version) {
        return res.status(400).json({ error: "Version is required" });
      }

      const result = await hotelbeds.confirmVersion(version);
      
      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Confirm version error:", error);
      res.status(500).json({ 
        error: "Failed to confirm version", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/hotels/cache/:fileType", async (req, res) => {
    try {
      if (!hotelbeds.isCacheApiConfigured()) {
        return res.status(503).json({ 
          error: "Cache API not configured",
          message: "Required secrets: HOTELBEDS_API_KEY, HOTELBEDS_CACHE_USERNAME, HOTELBEDS_CACHE_PASSWORD"
        });
      }

      const { fileType } = req.params;
      const validTypes = ['hotels', 'destinations', 'currencies', 'boards', 'categories'];
      
      if (!validTypes.includes(fileType)) {
        return res.status(400).json({ 
          error: `Invalid file type. Valid types: ${validTypes.join(', ')}` 
        });
      }

      const result = await hotelbeds.getCacheFiles(
        fileType as 'hotels' | 'destinations' | 'currencies' | 'boards' | 'categories'
      );
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Get cache files error:", error);
      res.status(500).json({ 
        error: "Failed to get cache files", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/hotels/cache/parse", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ 
          error: "Content is required and must be a string" 
        });
      }

      const parsedData = hotelbeds.parseCacheFileContent(content);
      
      res.json({ 
        success: true, 
        data: parsedData,
        summary: {
          contractHeaders: parsedData.contractHeaders.length,
          roomTypes: parsedData.roomTypes.length,
          noHotelContracts: parsedData.noHotelContracts.length,
          promotions: parsedData.promotions.length,
          handlingFees: parsedData.handlingFees.length,
          taxBreakdowns: parsedData.taxBreakdowns.length,
          validMarkets: parsedData.validMarkets.length,
          inventory: parsedData.inventory.length,
          prices: parsedData.prices.length,
          boardSupplements: parsedData.boardSupplements.length,
          supplements: parsedData.supplements.length,
          stopSales: parsedData.stopSales.length,
          frees: parsedData.frees.length,
          combinableOffers: parsedData.combinableOffers.length,
          minMaxStays: parsedData.minMaxStays.length,
          rateCodes: parsedData.rateCodes.length,
          checkInOuts: parsedData.checkInOuts.length,
          cancellationFees: parsedData.cancellationFees.length,
        }
      });
    } catch (error) {
      console.error("Parse cache content error:", error);
      res.status(500).json({ 
        error: "Failed to parse cache content", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/hotels/cache/tax-codes", async (_req, res) => {
    res.json({ 
      success: true, 
      taxCodes: hotelbeds.TAX_CODES 
    });
  });

  app.get("/api/hotels/cache/integration-codes", async (_req, res) => {
    res.json({ 
      success: true, 
      integrationCodes: hotelbeds.INTEGRATION_CODES,
      externalSuppliers: hotelbeds.EXTERNAL_SUPPLIERS,
    });
  });

  app.get("/api/hotels/cache/currency-codes", async (_req, res) => {
    res.json({ 
      success: true, 
      currencyCodes: hotelbeds.CURRENCY_CODES 
    });
  });

  app.get("/api/hotels/cache/conventions", async (_req, res) => {
    res.json({ 
      success: true,
      dateFormat: "YYYYMMDD",
      amountFormat: "Decimal with '.' as separator",
      folderStructure: {
        description: "DESTINATIONS/<IATA_CODE>/<files>",
        example: {
          DESTINATIONS: {
            PMI: ["1_1111", "1_2222"],
            BCN: ["44_1111", "44_1112", "BCN_1233_ID_B2B_ISHBAR"],
          },
        },
      },
      fileNaming: {
        internal: {
          pattern: "<incoming>_<contract>_<paymentModel>_<opaque>",
          examples: [
            "1_1234_M_F - Full info for merchant model",
            "1_1234_O_F - Full info for packaging (opaque)",
          ],
        },
        external: {
          pattern: "<destination>_<hotelCode>_<contractName>",
          examples: [
            "BCN_1233_ID_B2B_ISHBAR",
            "PMI_79852_ID_B2B_15_CONTRACT",
          ],
        },
      },
      externalSuppliers: hotelbeds.EXTERNAL_SUPPLIERS,
      currencyCodes: hotelbeds.CURRENCY_CODES,
    });
  });

  app.post("/api/hotels/cache/parse-date", async (req, res) => {
    try {
      const { date } = req.body;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: "date is required and must be a string" });
      }

      const parsed = hotelbeds.parseCacheDate(date);
      
      if (!parsed) {
        return res.status(400).json({ 
          error: "Invalid date format",
          expectedFormat: "YYYYMMDD",
          example: "20240315"
        });
      }
      
      res.json({ 
        success: true, 
        input: date,
        parsed: parsed.toISOString(),
        formatted: hotelbeds.formatCacheDate(parsed),
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to parse date", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/hotels/cache/parse-external", async (req, res) => {
    try {
      const { content, fileName } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ 
          error: "Content is required and must be a string" 
        });
      }

      const parsedData = hotelbeds.parseExternalInventoryContent(content, fileName);
      
      res.json({ 
        success: true, 
        data: parsedData,
        summary: {
          supplierPrices: parsedData.supplierPrices.length,
          supplierInventory: parsedData.supplierInventory.length,
          supplierMinMaxStays: parsedData.supplierMinMaxStays.length,
          supplierCancellationFees: parsedData.supplierCancellationFees.length,
          errors: parsedData.errors.length,
        }
      });
    } catch (error) {
      console.error("Parse external inventory error:", error);
      res.status(500).json({ 
        error: "Failed to parse external inventory content", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/hotels/cache/parse-combined", async (req, res) => {
    try {
      const { content, fileName } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ 
          error: "Content is required and must be a string" 
        });
      }

      const parsedData = hotelbeds.parseInventoryFile(content, fileName);
      
      res.json({ 
        success: true, 
        data: parsedData,
        summary: {
          internal: {
            contractHeaders: parsedData.internal.contractHeaders.length,
            roomTypes: parsedData.internal.roomTypes.length,
            prices: parsedData.internal.prices.length,
            inventory: parsedData.internal.inventory.length,
          },
          external: {
            supplierPrices: parsedData.external.supplierPrices.length,
            supplierInventory: parsedData.external.supplierInventory.length,
            supplierMinMaxStays: parsedData.external.supplierMinMaxStays.length,
            supplierCancellationFees: parsedData.external.supplierCancellationFees.length,
          }
        }
      });
    } catch (error) {
      console.error("Parse combined inventory error:", error);
      res.status(500).json({ 
        error: "Failed to parse combined inventory content", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/hotels/cache/check-booking-availability", async (req, res) => {
    try {
      const { isTotalPricePerStay, requestedNights, availableLengthsOfStay } = req.body;
      
      if (typeof isTotalPricePerStay !== 'boolean' || 
          typeof requestedNights !== 'number' || 
          !Array.isArray(availableLengthsOfStay)) {
        return res.status(400).json({ 
          error: "Invalid request parameters",
          required: {
            isTotalPricePerStay: "boolean",
            requestedNights: "number",
            availableLengthsOfStay: "number[]"
          }
        });
      }

      const result = hotelbeds.canSumPricesForLengthOfStay(
        isTotalPricePerStay,
        requestedNights,
        availableLengthsOfStay
      );
      
      res.json({ 
        success: true, 
        ...result
      });
    } catch (error) {
      console.error("Check booking availability error:", error);
      res.status(500).json({ 
        error: "Failed to check booking availability", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/hotels/cache/parse-filename", async (req, res) => {
    try {
      const { fileName } = req.body;
      
      if (!fileName || typeof fileName !== 'string') {
        return res.status(400).json({ 
          error: "fileName is required and must be a string" 
        });
      }

      const fileInfo = hotelbeds.parseExternalInventoryFileName(fileName);
      
      if (!fileInfo) {
        return res.status(400).json({ 
          error: "Invalid file name format",
          expectedFormat: "ID_B2B_ISMODIIFF_<hotelCode>_<internalCode>_<contractType>",
          example: "ID_B2B_ISMODIIFF_79852_80395_M"
        });
      }
      
      res.json({ 
        success: true, 
        fileInfo
      });
    } catch (error) {
      console.error("Parse filename error:", error);
      res.status(500).json({ 
        error: "Failed to parse filename", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ============================================
  // CERTIFICATION ENDPOINTS
  // ============================================

  app.get("/api/hotels/certification/checklist", async (_req, res) => {
    res.json({
      success: true,
      checklist: hotelbeds.getCertificationChecklist(),
    });
  });

  app.get("/api/hotels/certification/status", async (_req, res) => {
    res.json({
      success: true,
      status: hotelbeds.getCertificationStatus(),
    });
  });

  app.get("/api/hotels/certification/limits", async (_req, res) => {
    res.json({
      success: true,
      limits: hotelbeds.CERTIFICATION_LIMITS,
      rateTypes: hotelbeds.RATE_TYPES,
      sourceMarkets: hotelbeds.SOURCE_MARKETS,
      paymentTypes: hotelbeds.PAYMENT_TYPES,
    });
  });

  app.post("/api/hotels/certification/validate-hotels", async (req, res) => {
    try {
      const { hotelCodes } = req.body;

      const validation = hotelbeds.validateHotelCount(hotelCodes);
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          ...validation,
          limit: hotelbeds.CERTIFICATION_LIMITS.MAX_HOTELS_PER_AVAILABILITY,
        });
      }
      
      res.json({
        success: true,
        ...validation,
        limit: hotelbeds.CERTIFICATION_LIMITS.MAX_HOTELS_PER_AVAILABILITY,
      });
    } catch (error) {
      res.status(500).json({
        error: "Validation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/hotels/certification/validate-rates", async (req, res) => {
    try {
      const { rateKeys } = req.body;

      const validation = hotelbeds.validateRateCount(rateKeys);
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          ...validation,
          limit: hotelbeds.CERTIFICATION_LIMITS.MAX_RATES_PER_CHECKRATE,
        });
      }
      
      res.json({
        success: true,
        ...validation,
        limit: hotelbeds.CERTIFICATION_LIMITS.MAX_RATES_PER_CHECKRATE,
      });
    } catch (error) {
      res.status(500).json({
        error: "Validation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/hotels/certification/check-rate-type", async (req, res) => {
    try {
      const { rateType } = req.body;
      
      if (!rateType || typeof rateType !== 'string') {
        return res.status(400).json({ 
          error: "rateType is required and must be a string" 
        });
      }

      res.json({
        success: true,
        rateType,
        requiresCheckRate: hotelbeds.requiresCheckRate(rateType),
        explanation: rateType === hotelbeds.RATE_TYPES.RECHECK
          ? "This rate requires a CheckRate call before booking"
          : "This rate can be booked directly without CheckRate",
      });
    } catch (error) {
      res.status(500).json({
        error: "Check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/hotels/bookings/:reference/voucher", async (req, res) => {
    try {
      const { reference } = req.params;
      
      const booking = await hotelbeds.getBooking(reference);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const voucher = hotelbeds.generateVoucher(booking, req.body.hotelDetails);
      res.json({
        success: true,
        voucher,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to generate voucher",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/hotels/source-markets", async (_req, res) => {
    res.json({
      success: true,
      sourceMarkets: hotelbeds.SOURCE_MARKETS,
    });
  });

  return httpServer;
}

function getFlightTags(flight: any, allFlights: any[]): string[] {
  const tags: string[] = [];
  
  const sortedByPrice = [...allFlights].sort((a, b) => a.basePrice - b.basePrice);
  if (sortedByPrice[0]?.id === flight.id) {
    tags.push("Cheapest");
  }
  
  const sortedByDuration = [...allFlights].sort((a, b) => {
    const durationA = parseDuration(a.duration);
    const durationB = parseDuration(b.duration);
    return durationA - durationB;
  });
  if (sortedByDuration[0]?.id === flight.id && !tags.includes("Cheapest")) {
    tags.push("Fastest");
  }
  
  if (tags.length === 0 && flight.baggageIncluded && flight.stops === 0) {
    tags.push("Best Value");
  }
  
  return tags;
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)h\s*(\d+)?m?/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  return hours * 60 + minutes;
}
