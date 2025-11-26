# PIX Integration Guide

## Overview

This guide explains how to integrate the Daily Loan Pay system with real PIX payment providers. The current implementation uses a simulated PIX system for development and testing.

## Current Implementation

The system currently generates PIX keys and QR codes locally using the `qrcode` library. This is suitable for:

- Development and testing
- Demonstration purposes
- Understanding the payment flow

To move to production, you'll need to integrate with a real PIX provider.

## Recommended PIX Providers

### 1. Gerencianet (Recommended)

**Advantages:**
- Robust API with full PIX support
- Excellent documentation
- Reliable webhook system
- Good support for dynamic QR codes

**Integration Steps:**

1. Create an account at [Gerencianet](https://gerencianet.com.br)
2. Get your API credentials (Client ID and Client Secret)
3. Install the Gerencianet SDK:

```bash
pnpm add gerencianet
```

4. Create a new file `server/services/pix.ts`:

```typescript
import Gerencianet from "gerencianet";

const credentials = {
  client_id: process.env.GERENCIANET_CLIENT_ID,
  client_secret: process.env.GERENCIANET_CLIENT_SECRET,
  sandbox: process.env.NODE_ENV !== "production",
};

const gerencianet = new Gerencianet(credentials);

export async function generatePixQrCode(
  amount: number,
  loanId: number,
  userId: number
) {
  try {
    const params = {
      calendario: {
        expiracao: 3600, // 1 hour
      },
      devedor: {
        cpf: userCpf, // Get from database
        nome: userName, // Get from database
      },
      valor: {
        original: amount.toFixed(2),
      },
      chave: process.env.PIX_KEY, // Your PIX key
      solicitacaoPagador: `Pagamento diaria do emprestimo #${loanId}`,
    };

    const response = await gerencianet.pixCreateQrCode({}, params);

    return {
      pixKey: response.chave,
      qrCode: response.qrcode,
      transactionId: response.txid,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  } catch (error) {
    console.error("Error generating PIX QR code:", error);
    throw error;
  }
}

export async function checkPixPaymentStatus(transactionId: string) {
  try {
    const params = {
      txid: transactionId,
    };

    const response = await gerencianet.pixDetailQrCode(params);
    return response;
  } catch (error) {
    console.error("Error checking PIX status:", error);
    throw error;
  }
}
```

5. Update environment variables:

```env
GERENCIANET_CLIENT_ID=your_client_id
GERENCIANET_CLIENT_SECRET=your_client_secret
PIX_KEY=your_pix_key@bank.com.br
```

6. Update the payments router to use the real implementation:

```typescript
// In server/routers/payments.ts
import { generatePixQrCode } from "../services/pix";

// Replace the QRCode.toDataURL call with:
const pixResponse = await generatePixQrCode(
  dailyAmount,
  input.loanId,
  ctx.user.id
);

const pixKey = pixResponse.pixKey;
const pixQrCode = pixResponse.qrCode;
const pixTransactionId = pixResponse.transactionId;
```

### 2. Banco do Brasil

**Advantages:**
- Direct integration with major bank
- Lower fees
- Good API documentation

**Integration:**

1. Register at [Banco do Brasil Developer Portal](https://www.bb.com.br/pbb/pagina-inicial/apis)
2. Get API credentials
3. Install SDK:

```bash
pnpm add axios
```

4. Create similar service file with Banco do Brasil endpoints

### 3. Mercado Pago

**Advantages:**
- Easy integration
- Good documentation
- Supports multiple payment methods

**Integration:**

1. Create account at [Mercado Pago](https://www.mercadopago.com.br)
2. Get API credentials
3. Install SDK:

```bash
pnpm add mercadopago
```

## Webhook Implementation

### Setting Up Webhooks

1. **Configure Webhook URL** in your PIX provider dashboard:

```
https://your-domain.com/api/trpc/webhooks.pixConfirmation
```

2. **Webhook Signature Verification** (Important for security):

```typescript
// In server/routers/webhooks.ts
import crypto from "crypto";

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return hash === signature;
}

export const webhooksRouter = router({
  pixConfirmation: publicProcedure
    .input(webhookSchema)
    .mutation(async ({ input, ctx }) => {
      // Verify signature
      const payload = JSON.stringify(input);
      const signature = ctx.req.headers["x-webhook-signature"] as string;

      if (
        !verifyWebhookSignature(
          payload,
          signature,
          process.env.WEBHOOK_SECRET!
        )
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid webhook signature",
        });
      }

      // Process payment...
    }),
});
```

### Webhook Payload Example

```json
{
  "id": "webhook-123",
  "event": "pix.payment.received",
  "data": {
    "txid": "TXN-1-1234567890",
    "amount": "50.00",
    "payer": {
      "cpf": "12345678900",
      "name": "John Doe"
    },
    "timestamp": "2025-11-26T10:30:00Z"
  },
  "signature": "hash_signature_here"
}
```

## Testing Webhook Locally

For local development, use ngrok to expose your local server:

```bash
ngrok http 3000
```

Then configure your webhook URL in the provider dashboard:

```
https://your-ngrok-url.ngrok.io/api/trpc/webhooks.pixConfirmation
```

## Idempotency and Retry Logic

Implement idempotency to handle duplicate webhook calls:

```typescript
export async function processPixPayment(
  pixTransactionId: string,
  amount: number
) {
  // Check if already processed
  const existingPayment = await getPaymentByTransactionId(pixTransactionId);

  if (existingPayment && existingPayment.status === "confirmed") {
    console.log("Payment already processed:", pixTransactionId);
    return existingPayment;
  }

  // Process payment...
  // Update database...
  // Return result
}
```

## Error Handling

Implement robust error handling:

```typescript
export const webhooksRouter = router({
  pixConfirmation: publicProcedure
    .input(webhookSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await processPixPayment(
          input.pixTransactionId,
          parseFloat(input.amount)
        );
        return { success: true, data: result };
      } catch (error) {
        console.error("Webhook processing error:", error);

        // Return 200 to acknowledge receipt
        // Provider will retry if we return error
        return { success: false, error: error.message };
      }
    }),
});
```

## Production Checklist

Before deploying to production:

- [ ] Integrate with real PIX provider
- [ ] Configure webhook signature verification
- [ ] Set up webhook URL in provider dashboard
- [ ] Test webhook delivery with provider's test tools
- [ ] Implement retry logic for failed payments
- [ ] Set up monitoring and alerting for webhooks
- [ ] Configure proper error logging
- [ ] Test with real PIX transactions (small amounts)
- [ ] Set up database backups
- [ ] Configure HTTPS for all endpoints
- [ ] Review security settings in provider dashboard
- [ ] Set up rate limiting on webhook endpoint

## Environment Variables for Production

```env
# PIX Provider
PIX_PROVIDER=gerencianet
GERENCIANET_CLIENT_ID=xxx
GERENCIANET_CLIENT_SECRET=xxx
PIX_KEY=your_key@bank.com.br
WEBHOOK_SECRET=your_webhook_secret

# Security
WEBHOOK_SIGNATURE_HEADER=x-webhook-signature
WEBHOOK_TIMEOUT=30000

# Logging
LOG_LEVEL=info
LOG_WEBHOOK_PAYLOADS=false
```

## Monitoring and Debugging

### Webhook Logs

Log all webhook calls for debugging:

```typescript
import { logger } from "../services/logger";

export const webhooksRouter = router({
  pixConfirmation: publicProcedure
    .input(webhookSchema)
    .mutation(async ({ input }) => {
      logger.info("Webhook received", {
        transactionId: input.pixTransactionId,
        amount: input.amount,
        status: input.status,
      });

      try {
        const result = await processPixPayment(
          input.pixTransactionId,
          parseFloat(input.amount)
        );

        logger.info("Webhook processed successfully", {
          transactionId: input.pixTransactionId,
        });

        return { success: true };
      } catch (error) {
        logger.error("Webhook processing failed", {
          transactionId: input.pixTransactionId,
          error: error.message,
        });

        return { success: false };
      }
    }),
});
```

### Testing Tools

- **Postman**: Test webhook payloads manually
- **Webhook.site**: Inspect webhook calls
- **Provider Dashboard**: Use test mode for safe testing

## Common Issues and Solutions

### Issue: Webhook not being received

**Solution:**
1. Verify webhook URL is correct and publicly accessible
2. Check firewall/security group rules
3. Verify signature verification is not rejecting valid requests
4. Check logs for errors

### Issue: Duplicate payments being processed

**Solution:**
1. Implement idempotency checks
2. Use database transactions
3. Add unique constraints on transaction IDs

### Issue: Payment status not updating

**Solution:**
1. Verify webhook is being called
2. Check database connection
3. Review error logs
4. Test webhook manually with Postman

## References

- [Gerencianet Documentation](https://gerencianet.com.br/documentacao)
- [Banco do Brasil APIs](https://www.bb.com.br/pbb/pagina-inicial/apis)
- [Mercado Pago Developers](https://developers.mercadopago.com.br)
- [PIX Official Documentation](https://www.bcb.gov.br/pix)

---

**Last Updated**: November 26, 2025  
**Version**: 1.0.0
