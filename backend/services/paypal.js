import config from '../config.js';
import { HttpError, badRequest } from '../lib/httpError.js';

const isConfigured = () => Boolean(config.paypal.clientSecret);

const getAccessToken = async () => {
  const { clientId, clientSecret, apiBase } = config.paypal;
  const res = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new HttpError(502, 'Could not authenticate with PayPal.');
  return (await res.json()).access_token;
};

/**
 * Confirms with PayPal that `paypalOrderId` was captured for exactly `expectedTotal` USD.
 * Without a client secret (local sandbox use) the check is skipped outside production.
 */
export const verifyPayment = async (paypalOrderId, expectedTotal) => {
  if (!isConfigured()) {
    if (config.isProduction) throw new HttpError(503, 'Payments are not configured.');
    return { id: paypalOrderId, status: 'UNVERIFIED', verified: false };
  }

  const res = await fetch(`${config.paypal.apiBase}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, {
    headers: { Authorization: `Bearer ${await getAccessToken()}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 404) throw badRequest('PayPal order not found.');
  if (!res.ok) throw new HttpError(502, 'Could not verify payment with PayPal.');

  const paypalOrder = await res.json();
  const amount = paypalOrder.purchase_units?.[0]?.amount;
  if (paypalOrder.status !== 'COMPLETED') throw badRequest('Payment has not been completed.');
  if (amount?.currency_code !== 'USD' || amount.value !== expectedTotal.toFixed(2)) {
    throw badRequest('Paid amount does not match the order total.');
  }
  return {
    id: paypalOrder.id,
    status: paypalOrder.status,
    payerID: paypalOrder.payer?.payer_id,
    verified: true,
  };
};
