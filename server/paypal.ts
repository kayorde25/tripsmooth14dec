import { Request, Response } from "express";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

let client: any = null;
let ordersController: any = null;
let oAuthAuthorizationController: any = null;

async function initializePayPal() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.log("PayPal credentials not configured - PayPal payments disabled");
    return false;
  }

  try {
    const {
      Client,
      Environment,
      LogLevel,
      OAuthAuthorizationController,
      OrdersController,
    } = await import("@paypal/paypal-server-sdk");

    client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
      },
      timeout: 0,
      environment:
        process.env.NODE_ENV === "production"
          ? Environment.Production
          : Environment.Sandbox,
      logging: {
        logLevel: LogLevel.Info,
        logRequest: {
          logBody: true,
        },
        logResponse: {
          logHeaders: true,
        },
      },
    });

    ordersController = new OrdersController(client);
    oAuthAuthorizationController = new OAuthAuthorizationController(client);
    return true;
  } catch (error) {
    console.error("Failed to initialize PayPal:", error);
    return false;
  }
}

let paypalInitialized: boolean | null = null;

async function ensurePayPalInitialized(): Promise<boolean> {
  if (paypalInitialized === null) {
    paypalInitialized = await initializePayPal();
  }
  return paypalInitialized;
}

export async function getClientToken() {
  if (!await ensurePayPalInitialized()) {
    throw new Error("PayPal not configured");
  }

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    if (!await ensurePayPalInitialized()) {
      return res.status(503).json({ error: "PayPal is not configured. Please add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET." });
    }

    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        error: "Invalid amount. Amount must be a positive number.",
      });
    }

    if (!currency) {
      return res.status(400).json({ error: "Invalid currency. Currency is required." });
    }

    if (!intent) {
      return res.status(400).json({ error: "Invalid intent. Intent is required." });
    }

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    if (!await ensurePayPalInitialized()) {
      return res.status(503).json({ error: "PayPal is not configured." });
    }

    const { orderID } = req.params;
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to capture order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  try {
    if (!await ensurePayPalInitialized()) {
      return res.status(503).json({ error: "PayPal is not configured.", configured: false });
    }

    const clientToken = await getClientToken();
    res.json({
      clientToken,
      configured: true,
    });
  } catch (error) {
    console.error("Failed to get client token:", error);
    res.status(500).json({ error: "Failed to initialize PayPal." });
  }
}
