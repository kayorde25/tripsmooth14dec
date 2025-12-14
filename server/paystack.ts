const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export function isPaystackConfigured(): boolean {
  return !!PAYSTACK_SECRET_KEY;
}

export interface InitializeTransactionParams {
  email: string;
  amount: number;
  currency?: string;
  reference?: string;
  callbackUrl?: string;
  metadata?: {
    flightOfferId?: string;
    bookingReference?: string;
    passengerCount?: number;
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
  };
}

export interface InitializeTransactionResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerifyTransactionResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    paid_at: string | null;
    created_at: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    };
    metadata: any;
    gateway_response: string;
    fees: number;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}

export async function initializeTransaction(
  params: InitializeTransactionParams
): Promise<InitializeTransactionResponse> {
  if (!isPaystackConfigured()) {
    throw new Error('Paystack API is not configured');
  }

  const amountInKobo = Math.round(params.amount * 100);

  const requestBody: any = {
    email: params.email,
    amount: amountInKobo,
    currency: params.currency || 'NGN',
  };

  if (params.reference) {
    requestBody.reference = params.reference;
  }

  if (params.callbackUrl) {
    requestBody.callback_url = params.callbackUrl;
  }

  if (params.metadata) {
    requestBody.metadata = params.metadata;
  }

  console.log('Paystack initialize request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Paystack initialize error:', error);
    throw new Error(`Paystack initialization failed: ${response.status} - ${error}`);
  }

  const data: InitializeTransactionResponse = await response.json();
  console.log('Paystack transaction initialized:', data.data.reference);

  return data;
}

export async function verifyTransaction(
  reference: string
): Promise<VerifyTransactionResponse> {
  if (!isPaystackConfigured()) {
    throw new Error('Paystack API is not configured');
  }

  console.log('Paystack verify request for reference:', reference);

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Paystack verify error:', error);
    throw new Error(`Paystack verification failed: ${response.status} - ${error}`);
  }

  const data: VerifyTransactionResponse = await response.json();
  console.log('Paystack verification result:', data.data.status);

  return data;
}

export function generateReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TS-PAY-${timestamp}-${random}`.toUpperCase();
}

export function convertCurrency(amount: number, fromCurrency: string): number {
  const rates: Record<string, number> = {
    'EUR': 1700,
    'USD': 1550,
    'GBP': 1950,
    'NGN': 1,
  };

  const rate = rates[fromCurrency] || rates['USD'];
  return Math.round(amount * rate);
}
