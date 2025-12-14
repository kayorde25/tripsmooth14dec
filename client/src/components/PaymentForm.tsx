import { useState } from "react";
import { CreditCard, Lock, Shield, CheckCircle, Smartphone, Building2, ExternalLink } from "lucide-react";
import { SiVisa, SiMastercard } from "react-icons/si";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface PaymentFormProps {
  totalAmount: number;
  currency: string;
  onSubmit: () => void;
  onPaystackPayment?: (method: string) => void;
  isProcessing?: boolean;
  promoDiscount?: number;
  paystackConfigured?: boolean;
}

export default function PaymentForm({ 
  totalAmount, 
  currency, 
  onSubmit, 
  onPaystackPayment,
  isProcessing, 
  promoDiscount = 0,
  paystackConfigured = true 
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const finalAmount = totalAmount - promoDiscount;

  const formatPrice = (price: number, curr: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "paystack" && onPaystackPayment) {
      onPaystackPayment(paymentMethod);
    } else {
      onSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Payment</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Method</CardTitle>
            <CardDescription>
              Secure payment powered by Paystack
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              <div
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  paymentMethod === "paystack" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <RadioGroupItem value="paystack" id="paystack" data-testid="radio-paystack" />
                <Label htmlFor="paystack" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5" />
                    <div>
                      <span className="font-medium">Pay with Paystack</span>
                      <p className="text-sm text-muted-foreground">
                        Card, Bank Transfer, Mobile Money, USSD
                      </p>
                    </div>
                  </div>
                </Label>
                <div className="flex items-center gap-2">
                  <SiVisa className="w-8 h-8 text-blue-600" />
                  <SiMastercard className="w-8 h-8" />
                  <Badge variant="secondary" className="text-xs">Secure</Badge>
                </div>
              </div>

              <div
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  paymentMethod === "bank" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <RadioGroupItem value="bank" id="bank" data-testid="radio-bank" />
                <Label htmlFor="bank" className="flex-1 cursor-pointer flex items-center gap-3">
                  <Building2 className="w-5 h-5" />
                  <div>
                    <span className="font-medium">Bank Transfer (Paystack)</span>
                    <p className="text-sm text-muted-foreground">
                      Instant transfer via your bank
                    </p>
                  </div>
                </Label>
                <Badge variant="outline" className="text-xs">Instant</Badge>
              </div>

              <div
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  paymentMethod === "mobile" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <RadioGroupItem value="mobile" id="mobile" data-testid="radio-mobile" />
                <Label htmlFor="mobile" className="flex-1 cursor-pointer flex items-center gap-3">
                  <Smartphone className="w-5 h-5" />
                  <div>
                    <span className="font-medium">Mobile Money</span>
                    <p className="text-sm text-muted-foreground">
                      MTN, Airtel, and other mobile wallets
                    </p>
                  </div>
                </Label>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">MTN</Badge>
                  <Badge variant="outline" className="text-xs">Airtel</Badge>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Secure Payment</p>
                    <p className="text-muted-foreground">
                      You'll be redirected to Paystack's secure checkout page to complete your payment. 
                      Your card details are never stored on our servers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                  data-testid="checkbox-terms"
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">
                  I agree to the booking terms, fare conditions, and privacy policy. I understand that my booking is subject to the airline's conditions of carriage.
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <div className="flex items-baseline gap-2">
              {promoDiscount > 0 && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(totalAmount, currency)}
                </span>
              )}
              <p className="text-3xl font-bold" data-testid="text-payment-total">
                {formatPrice(finalAmount, currency)}
              </p>
            </div>
            {promoDiscount > 0 && (
              <p className="text-sm text-green-600 dark:text-green-400">
                You save {formatPrice(promoDiscount, currency)}
              </p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!acceptTerms || isProcessing || !paystackConfigured}
            className="w-full sm:w-auto"
            data-testid="button-complete-booking"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Pay with Paystack
              </>
            )}
          </Button>
        </div>

        {!paystackConfigured && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Payment gateway is not configured. Please contact support.
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2 text-xs">
            <Shield className="w-4 h-4" />
            Secure Checkout
          </div>
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle className="w-4 h-4" />
            Price Guarantee
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Lock className="w-4 h-4" />
            PCI Compliant
          </div>
        </div>
      </form>
    </div>
  );
}
