import { z } from "zod";
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
