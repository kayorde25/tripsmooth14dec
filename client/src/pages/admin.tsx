import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Plane,
  Users,
  TrendingUp,
  Search,
  Eye,
  Edit,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Settings,
  DollarSign,
  Ticket,
  Building2,
  LogIn,
  Shield,
} from "lucide-react";

interface BookingData {
  id: string;
  reference: string;
  status: string;
  flightId: string;
  fareType: string;
  totalPrice: number;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  paymentId?: string;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the admin area.",
        variant: "destructive",
      });
    }
  }, [authLoading, isAuthenticated, toast]);

  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings, error: bookingsError } = useQuery<BookingData[]>({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated,
    retry: false,
  });

  const isForbidden = bookingsError && (bookingsError as any)?.message?.includes('403');

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const formatPrice = (price: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "scheduled":
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" /> {status}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400"><XCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
      case "delayed":
        return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400"><AlertCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalRevenue = bookings.filter(b => b.status !== "cancelled").reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
  const pendingBookings = bookings.filter(b => b.status === "pending").length;

  const filteredBookings = bookings.filter(b => 
    b.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isDark={isDark} onToggleTheme={handleThemeToggle} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header isDark={isDark} onToggleTheme={handleThemeToggle} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Admin Access Required</CardTitle>
              <CardDescription>
                Please log in to access the administration panel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-admin-login"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Log In
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation("/")}
                data-testid="button-back-home"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="min-h-screen bg-background">
        <Header isDark={isDark} onToggleTheme={handleThemeToggle} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Admin Privileges Required</CardTitle>
              <CardDescription>
                Your account does not have administrator access. Please contact an administrator for access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                Log Out
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation("/")}
                data-testid="button-back-home"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} onToggleTheme={handleThemeToggle} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Administration
            </h1>
            <p className="text-muted-foreground">
              Welcome, {user?.firstName || user?.email || 'Admin'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/api/logout"}
              data-testid="button-logout"
            >
              Log Out
            </Button>
            <Button onClick={() => setLocation("/")} variant="outline" data-testid="button-back-home">
              Back to Home
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2" data-testid="tab-dashboard">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2" data-testid="tab-bookings">
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-total-revenue">{formatPrice(totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3 inline mr-1 text-green-500" />
                        From confirmed bookings
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confirmed Bookings</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-confirmed-bookings">{confirmedBookings}</div>
                      <p className="text-xs text-muted-foreground">Active reservations</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-pending-bookings">{pendingBookings}</div>
                      <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Ticket className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-total-bookings">{bookings.length}</div>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Bookings</CardTitle>
                  <CardDescription>Latest booking activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No bookings yet</p>
                      <p className="text-sm">Bookings will appear here when customers book flights</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{booking.contactEmail}</p>
                              <p className="text-xs text-muted-foreground">{booking.reference} • {booking.fareType}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatPrice(booking.totalPrice || 0)}</p>
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => setLocation("/flights")}
                    >
                      <Plane className="w-6 h-6" />
                      <span className="text-sm">Search Flights</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => setLocation("/hotels")}
                    >
                      <Building2 className="w-6 h-6" />
                      <span className="text-sm">Search Hotels</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => setLocation("/manage-booking")}
                    >
                      <Ticket className="w-6 h-6" />
                      <span className="text-sm">Manage Booking</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => {
                        refetchBookings();
                        toast({ title: "Refreshed", description: "Data updated successfully" });
                      }}
                    >
                      <RefreshCw className="w-6 h-6" />
                      <span className="text-sm">Refresh Data</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Booking Management</CardTitle>
                    <CardDescription>View and manage all bookings</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search bookings..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        data-testid="input-search-bookings"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => {
                        refetchBookings();
                        toast({ title: "Refreshed", description: "Booking data updated" });
                      }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Bookings Found</h3>
                    <p>Bookings will appear here when customers complete their reservations.</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Fare Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-mono text-sm">{booking.reference}</TableCell>
                            <TableCell>{booking.contactEmail}</TableCell>
                            <TableCell className="capitalize">{booking.fareType}</TableCell>
                            <TableCell>{formatPrice(booking.totalPrice || 0)}</TableCell>
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowBookingDialog(true);
                                  }}
                                  data-testid={`button-view-booking-${booking.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" data-testid={`button-edit-booking-${booking.id}`}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Reference: {selectedBooking?.reference}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedBooking.contactEmail}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedBooking.contactPhone || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fare Type</Label>
                  <p className="font-medium capitalize">{selectedBooking.fareType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Amount</Label>
                  <p className="font-medium text-primary">{formatPrice(selectedBooking.totalPrice || 0)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment ID</Label>
                  <p className="font-medium font-mono text-xs">{selectedBooking.paymentId || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
