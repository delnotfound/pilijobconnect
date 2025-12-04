import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

// Use SQLite for local development
const sqlite = new Database("./pili_jobs.db");
export const db = drizzle(sqlite, { schema });
export const pool = null; // Not used for SQLite
