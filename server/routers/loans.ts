import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createLoan, getLoansByUserId, getLoanById } from "../db";
import { TRPCError } from "@trpc/server";

const createLoanSchema = z.object({
  userId: z.number().int().positive(),
  totalAmount: z.string(),
  dailyAmount: z.string(),
});

export const loansRouter = router({
  create: protectedProcedure
    .input(createLoanSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create loans",
        });
      }

      const totalAmount = parseFloat(input.totalAmount);
      const dailyAmount = parseFloat(input.dailyAmount);

      if (totalAmount <= 0 || dailyAmount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Values must be greater than zero",
        });
      }

      if (dailyAmount > totalAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Daily amount cannot exceed total",
        });
      }

      try {
        const loan = await createLoan({
          userId: input.userId,
          totalAmount: totalAmount.toString() as any,
          dailyAmount: dailyAmount.toString() as any,
          remainingAmount: totalAmount.toString() as any,
          status: "active",
        });

        if (!loan) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create loan",
          });
        }

        return loan;
      } catch (error) {
        console.error("Error creating loan:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating loan",
        });
      }
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userLoans = await getLoansByUserId(ctx.user.id);
      return userLoans;
    } catch (error) {
      console.error("Error fetching loans:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching loans",
      });
    }
  }),

  getById: protectedProcedure
    .input(z.object({ loanId: z.number().int().positive() }))
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

        return loan;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching loan:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error fetching loan",
        });
      }
    }),

  getDetails: protectedProcedure
    .input(z.object({ loanId: z.number().int().positive() }))
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

        const totalAmount = parseFloat(loan.totalAmount as any);
        const dailyAmount = parseFloat(loan.dailyAmount as any);
        const paidAmount = parseFloat(loan.paidAmount as any);
        const remainingAmount = parseFloat(loan.remainingAmount as any);

        const daysRemaining = Math.ceil(remainingAmount / dailyAmount);
        const daysElapsed = Math.floor(paidAmount / dailyAmount);

        return {
          ...loan,
          totalAmount,
          dailyAmount,
          paidAmount,
          remainingAmount,
          daysRemaining,
          daysElapsed,
          progressPercentage: (paidAmount / totalAmount) * 100,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching loan details:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error fetching loan details",
        });
      }
    }),
});
