import { z } from "zod";
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
