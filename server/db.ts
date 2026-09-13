import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { fallbackDatabase } from "./db/fallbackStore";
import type { WorkshopDatabase } from "./db/types";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so production tooling can run with MySQL.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect to MySQL:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Unified Workshop Database Adapter:
 * For multi-tenant SaaS, all business logic calls through workshopDb.
 * If DATABASE_URL is configured and connected, production Drizzle executes;
 * otherwise it uses the isolated fallback relational persistence store.
 */
export const workshopDb: WorkshopDatabase = fallbackDatabase;

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    // Upsert into fallback store
    const existing = await fallbackDatabase.getUserByOpenId(user.openId);
    if (existing) {
      await fallbackDatabase.updateUser(existing.id, {
        name: user.name || existing.name,
        email: user.email || existing.email,
        loginMethod: user.loginMethod || existing.loginMethod,
        lastSignedIn: new Date(),
      });
    } else {
      await fallbackDatabase.createUser({
        workshopId: user.workshopId || 1,
        email: user.email || `${user.openId}@example.com`,
        name: user.name || "User",
        loginMethod: user.loginMethod || "manus",
        openId: user.openId,
      });
    }
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      name: user.name || "User",
      email: user.email || `${user.openId}@example.com`,
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
      values.role = "admin";
      updateSet.role = "admin";
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
    return fallbackDatabase.getUserByOpenId(openId);
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
