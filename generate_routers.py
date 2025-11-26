#!/usr/bin/env python3
import os

# Create payments router
payments_code = '''import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createDailyPayment,
  getDailyPaymentByLoanAndDate,
  updateDailyPayment,
  getLoanById,
  updateLoan,
  createPayment,
  getDailyPaymentByTransactionId,
} from "../db";
import { TRPCError } from "@trpc/server";
import QRCode from "qrcode";

const generateDailyPaymentSchema = z.object({
  loanId: z.number().int().positive(),
});

const checkPaymentStatusSchema = z.object({
  loanId: z.number().int().positive(),
});

export const paymentsRouter = router({
  generateDaily: protectedProcedure
    .input(generateDailyPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const loan = await getLoanById(input.loanId);

        if (!loan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Loan not found",
          });
        }

        if (loan.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "No permission to access this loan",
          });
        }

        if (loan.status !== "active") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Loan is not active",
          });
        }

        const remainingAmount = parseFloat(loan.remainingAmount as any);
        if (remainingAmount <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Loan is already paid off",
          });
        }

        const today = new Date();
        const dateStr = today.toISOString().split("T")[0];
        const paymentDate = new Date(dateStr);

        const existingPayment = await getDailyPaymentByLoanAndDate(
          input.loanId,
          paymentDate
        );

        if (existingPayment && existingPayment.status === "confirmed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment already confirmed for today",
          });
        }

        const dailyAmount = parseFloat(loan.dailyAmount as any);
        const pixKey = `daily-loan-${input.loanId}-${dateStr.replace(/-/g, "")}`;
        const pixQrCode = await QRCode.toDataURL(pixKey);
        const pixTransactionId = `TXN-${input.loanId}-${Date.now()}`;

        const expiresAt = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        if (existingPayment) {
          const updated = await updateDailyPayment(existingPayment.id, {
            pixKey,
            pixQrCode,
            pixTransactionId,
            status: "pending",
            expiresAt,
          });
          return updated;
        } else {
          const created = await createDailyPayment({
            loanId: input.loanId,
            paymentDate: dateStr as any,
            pixKey,
            pixQrCode,
            pixTransactionId,
            status: "pending",
            expiresAt,
          });
          return created;
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error generating daily payment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error generating daily payment",
        });
      }
    }),

  getDailyStatus: protectedProcedure
    .input(checkPaymentStatusSchema)
    .query(async ({ ctx, input }) => {
      try {
        const loan = await getLoanById(input.loanId);

        if (!loan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Loan not found",
          });
        }

        if (loan.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "No permission to access this loan",
          });
        }

        const today = new Date();
        const dateStr = today.toISOString().split("T")[0];
        const paymentDate = new Date(dateStr);

        const dailyPayment = await getDailyPaymentByLoanAndDate(
          input.loanId,
          paymentDate
        );

        if (!dailyPayment) {
          return null;
        }

        return dailyPayment;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error checking payment status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error checking payment status",
        });
      }
    }),
});
'''

# Create webhooks router
webhooks_code = '''import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getDailyPaymentByTransactionId,
  updateDailyPayment,
  getLoanById,
  updateLoan,
  createPayment,
} from "../db";
import { TRPCError } from "@trpc/server";

const webhookSchema = z.object({
  pixTransactionId: z.string(),
  amount: z.string(),
  status: z.string(),
  timestamp: z.string().optional(),
});

export const webhooksRouter = router({
  pixConfirmation: publicProcedure
    .input(webhookSchema)
    .mutation(async ({ input }) => {
      try {
        if (input.status !== "confirmed") {
          console.log("Webhook received with non-confirmed status:", input.status);
          return { success: true };
        }

        const dailyPayment = await getDailyPaymentByTransactionId(
          input.pixTransactionId
        );

        if (!dailyPayment) {
          console.warn("Daily payment not found for transaction:", input.pixTransactionId);
          return { success: true };
        }

        if (dailyPayment.status === "confirmed") {
          console.log("Payment already confirmed:", input.pixTransactionId);
          return { success: true };
        }

        const loan = await getLoanById(dailyPayment.loanId);
        if (!loan) {
          console.error("Loan not found for daily payment:", dailyPayment.id);
          return { success: false };
        }

        const amount = parseFloat(input.amount);
        const paidAmount = parseFloat(loan.paidAmount as any);
        const remainingAmount = parseFloat(loan.remainingAmount as any);

        const newPaidAmount = paidAmount + amount;
        const newRemainingAmount = Math.max(0, remainingAmount - amount);
        const newStatus = newRemainingAmount <= 0 ? "paid_off" : loan.status;

        await updateDailyPayment(dailyPayment.id, {
          status: "confirmed",
        });

        await updateLoan(dailyPayment.loanId, {
          paidAmount: newPaidAmount.toString() as any,
          remainingAmount: newRemainingAmount.toString() as any,
          status: newStatus as any,
        });

        await createPayment({
          loanId: dailyPayment.loanId,
          userId: loan.userId,
          amount: amount.toString() as any,
          pixKey: dailyPayment.pixKey,
          pixQrCode: dailyPayment.pixQrCode,
          pixTransactionId: input.pixTransactionId,
          status: "confirmed",
          confirmedAt: new Date(),
        });

        console.log("Payment confirmed successfully:", input.pixTransactionId);
        return { success: true };
      } catch (error) {
        console.error("Error processing webhook:", error);
        return { success: false };
      }
    }),
});
'''

# Write files
os.makedirs("/home/ubuntu/daily-loan-pay/server/routers", exist_ok=True)

with open("/home/ubuntu/daily-loan-pay/server/routers/payments.ts", "w", encoding="utf-8") as f:
    f.write(payments_code)

with open("/home/ubuntu/daily-loan-pay/server/routers/webhooks.ts", "w", encoding="utf-8") as f:
    f.write(webhooks_code)

print("Routers created successfully!")
