import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  cpf: varchar("cpf", { length: 14 }).unique(),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Loans table - stores all loans created for users
 */
export const loans = mysqlTable("loans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  dailyAmount: decimal("dailyAmount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).default("0").notNull(),
  remainingAmount: decimal("remainingAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["active", "paid_off", "overdue"]).default("active").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  expectedEndDate: date("expectedEndDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;

/**
 * Payments table - tracks all payment transactions for audit
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  loanId: int("loanId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  pixKey: varchar("pixKey", { length: 255 }),
  pixQrCode: text("pixQrCode"),
  pixTransactionId: varchar("pixTransactionId", { length: 255 }).unique(),
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  paymentDate: timestamp("paymentDate").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Daily payments table - controls daily payment generation for each loan
 */
export const dailyPayments = mysqlTable("dailyPayments", {
  id: int("id").autoincrement().primaryKey(),
  loanId: int("loanId").notNull(),
  paymentDate: date("paymentDate").notNull(),
  pixKey: varchar("pixKey", { length: 255 }),
  pixQrCode: text("pixQrCode"),
  pixTransactionId: varchar("pixTransactionId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "confirmed", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyPayment = typeof dailyPayments.$inferSelect;
export type InsertDailyPayment = typeof dailyPayments.$inferInsert;