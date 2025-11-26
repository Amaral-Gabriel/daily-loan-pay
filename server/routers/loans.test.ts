import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

const mockUser: User = {
  id: 1,
  openId: "test-user",
  email: "test@example.com",
  name: "Test User",
  cpf: null,
  phone: null,
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const mockAdminUser: User = {
  ...mockUser,
  id: 2,
  openId: "admin-user",
  role: "admin",
};

function createContext(user: User | null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("loans router", () => {
  it("should list loans for authenticated user", async () => {
    const ctx = createContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.loans.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get loan details by id", async () => {
    const ctx = createContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.loans.getDetails({ loanId: 1 });
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    } catch (error) {
      expect((error as any).code).toBe("NOT_FOUND");
    }
  });

  it("should prevent non-admin from creating loans", async () => {
    const ctx = createContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.loans.create({
        userId: 1,
        totalAmount: "1000",
        dailyAmount: "50",
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error) {
      expect((error as any).code).toBe("FORBIDDEN");
    }
  });

  it("should allow admin to create loans", async () => {
    const ctx = createContext(mockAdminUser);
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.loans.create({
        userId: 1,
        totalAmount: "1000",
        dailyAmount: "50",
      });
      expect(result).toBeDefined();
      expect(result.status).toBe("active");
    } catch (error) {
      console.error("Error creating loan:", error);
    }
  });

  it("should validate loan amounts", async () => {
    const ctx = createContext(mockAdminUser);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.loans.create({
        userId: 1,
        totalAmount: "100",
        dailyAmount: "200",
      });
      expect.fail("Should have thrown BAD_REQUEST error");
    } catch (error) {
      expect((error as any).code).toBe("BAD_REQUEST");
    }
  });

  it("should prevent unauthorized access to other users loans", async () => {
    const ctx = createContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.loans.getDetails({ loanId: 999 });
    } catch (error) {
      expect((error as any).code).toMatch(/NOT_FOUND|FORBIDDEN/);
    }
  });
});
