import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

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
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["Admin", "Marketing", "Viewer"]).default("Viewer").notNull(),
  accessStatus: mysqlEnum("accessStatus", ["Active", "Pending", "Inactive"]).default("Pending").notNull(),
  requestedAt: timestamp("requestedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Role constants matching exact business labels
export const ROLES = {
  ADMIN: "Admin",
  MARKETING: "Marketing",
  VIEWER: "Viewer",
} as const;

export const ACCESS_STATUSES = {
  ACTIVE: "Active",
  PENDING: "Pending",
  INACTIVE: "Inactive",
} as const;

/**
 * Workflow requests table - tracks all marketing approval requests
 */
export const workflowRequests = mysqlTable("workflow_requests", {
  id: int("id").autoincrement().primaryKey(),
  requestId: varchar("requestId", { length: 32 }).notNull().unique(), // REQ-XXXX format
  senderId: int("senderId").notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  assigneeId: int("assigneeId"),
  assigneeName: varchar("assigneeName", { length: 255 }).notNull(),
  assigneeEmail: varchar("assigneeEmail", { length: 320 }).notNull(),
  requestType: varchar("requestType", { length: 255 }).notNull(),
  status: mysqlEnum("status", [
    "Pending Approval",
    "Approved",
    "On Hold",
    "Revision Required",
    "Clarification Needed",
    "Ready to Publish",
  ]).default("Pending Approval").notNull(),
  mediaLink: text("mediaLink"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkflowRequest = typeof workflowRequests.$inferSelect;
export type InsertWorkflowRequest = typeof workflowRequests.$inferInsert;

/**
 * Activity log table - tracks all actions on workflow requests
 */
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  requestId: varchar("requestId", { length: 32 }).notNull(),
  actorId: int("actorId"),
  actorName: varchar("actorName", { length: 255 }).notNull(),
  actorEmail: varchar("actorEmail", { length: 320 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(), // "Created", "Status changed to: X", "Comment", "Team Update Sent"
  note: text("note"), // Comment text or additional details
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;