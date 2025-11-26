import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, loans, payments, dailyPayments, Loan, Payment, DailyPayment, InsertLoan, InsertPayment, InsertDailyPayment } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// LOANS QUERIES
// ============================================================================

export async function createLoan(data: InsertLoan): Promise<Loan | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create loan: database not available");
    return null;
  }

  try {
    const result = await db.insert(loans).values(data);
    const loanId = result[0].insertId;
    const created = await db.select().from(loans).where(eq(loans.id, Number(loanId))).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create loan:", error);
    throw error;
  }
}

export async function getLoansByUserId(userId: number): Promise<Loan[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get loans: database not available");
    return [];
  }

  try {
    return await db.select().from(loans).where(eq(loans.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get loans:", error);
    throw error;
  }
}

export async function getLoanById(loanId: number): Promise<Loan | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get loan: database not available");
    return null;
  }

  try {
    const result = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get loan:", error);
    throw error;
  }
}

export async function updateLoan(loanId: number, data: Partial<InsertLoan>): Promise<Loan | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update loan: database not available");
    return null;
  }

  try {
    await db.update(loans).set(data).where(eq(loans.id, loanId));
    return await getLoanById(loanId);
  } catch (error) {
    console.error("[Database] Failed to update loan:", error);
    throw error;
  }
}

// ============================================================================
// PAYMENTS QUERIES
// ============================================================================

export async function createPayment(data: InsertPayment): Promise<Payment | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create payment: database not available");
    return null;
  }

  try {
    const result = await db.insert(payments).values(data);
    const paymentId = result[0].insertId;
    const created = await db.select().from(payments).where(eq(payments.id, Number(paymentId))).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create payment:", error);
    throw error;
  }
}

export async function getPaymentsByLoanId(loanId: number): Promise<Payment[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get payments: database not available");
    return [];
  }

  try {
    return await db.select().from(payments).where(eq(payments.loanId, loanId)).orderBy(desc(payments.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get payments:", error);
    throw error;
  }
}

export async function getPaymentByTransactionId(pixTransactionId: string): Promise<Payment | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get payment: database not available");
    return null;
  }

  try {
    const result = await db.select().from(payments).where(eq(payments.pixTransactionId, pixTransactionId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get payment:", error);
    throw error;
  }
}

export async function updatePayment(paymentId: number, data: Partial<InsertPayment>): Promise<Payment | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update payment: database not available");
    return null;
  }

  try {
    await db.update(payments).set(data).where(eq(payments.id, paymentId));
    const updated = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    return updated.length > 0 ? updated[0] : null;
  } catch (error) {
    console.error("[Database] Failed to update payment:", error);
    throw error;
  }
}

// ============================================================================
// DAILY PAYMENTS QUERIES
// ============================================================================

export async function createDailyPayment(data: InsertDailyPayment): Promise<DailyPayment | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create daily payment: database not available");
    return null;
  }

  try {
    const result = await db.insert(dailyPayments).values(data);
    const dailyPaymentId = result[0].insertId;
    const created = await db.select().from(dailyPayments).where(eq(dailyPayments.id, Number(dailyPaymentId))).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create daily payment:", error);
    throw error;
  }
}

export async function getDailyPaymentByLoanAndDate(loanId: number, paymentDate: Date): Promise<DailyPayment | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get daily payment: database not available");
    return null;
  }

  try {
    const dateStr = paymentDate.toISOString().split('T')[0];
    const result = await db.select().from(dailyPayments).where(
      and(
        eq(dailyPayments.loanId, loanId),
        eq(dailyPayments.paymentDate, dateStr as any)
      )
    ).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get daily payment:", error);
    throw error;
  }
}

export async function updateDailyPayment(dailyPaymentId: number, data: Partial<InsertDailyPayment>): Promise<DailyPayment | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update daily payment: database not available");
    return null;
  }

  try {
    await db.update(dailyPayments).set(data).where(eq(dailyPayments.id, dailyPaymentId));
    const updated = await db.select().from(dailyPayments).where(eq(dailyPayments.id, dailyPaymentId)).limit(1);
    return updated.length > 0 ? updated[0] : null;
  } catch (error) {
    console.error("[Database] Failed to update daily payment:", error);
    throw error;
  }
}

export async function getDailyPaymentByTransactionId(pixTransactionId: string): Promise<DailyPayment | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get daily payment: database not available");
    return null;
  }

  try {
    const result = await db.select().from(dailyPayments).where(eq(dailyPayments.pixTransactionId, pixTransactionId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get daily payment:", error);
    throw error;
  }
}
