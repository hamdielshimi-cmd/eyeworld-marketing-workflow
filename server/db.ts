import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, workflowRequests, InsertWorkflowRequest, activityLogs, InsertActivityLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  const connectionString = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (!_db && connectionString) {
    try {
      _db = drizzle(connectionString);
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
      values.role = 'Admin';
      updateSet.role = 'Admin';
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

/**
 * Workflow Requests Queries
 */
export async function getWorkflowRequestById(requestId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workflowRequests).where(eq(workflowRequests.requestId, requestId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllWorkflowRequests() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workflowRequests).orderBy(desc(workflowRequests.createdAt));
}

export async function createWorkflowRequest(data: InsertWorkflowRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workflowRequests).values(data);
  return result;
}

export async function updateWorkflowRequestStatus(requestId: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workflowRequests).set({ status: status as any }).where(eq(workflowRequests.requestId, requestId));
}

/**
 * Activity Logs Queries
 */
export async function getActivityLogsByRequestId(requestId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(activityLogs).where(eq(activityLogs.requestId, requestId)).orderBy(activityLogs.createdAt);
}

export async function createActivityLog(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(activityLogs).values(data);
}

/**
 * User Queries for Workflow
 */
export async function getAllActiveUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.accessStatus, "Active"));
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(users.createdAt);
}

export async function updateUserAccessStatus(userId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ accessStatus: status as any }).where(eq(users.id, userId));
}

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role: role as any }).where(eq(users.id, userId));
}

export async function generateNextRequestId(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const lastRequest = await db.select().from(workflowRequests).orderBy(desc(workflowRequests.id)).limit(1);
  
  if (lastRequest.length === 0) {
    return "REQ-1001";
  }
  
  const lastId = lastRequest[0].requestId;
  const match = lastId.match(/REQ-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `REQ-${nextNum}`;
  }
  
  return "REQ-1001";
}
