import { Database } from "bun:sqlite"
import { existsSync, mkdirSync } from "node:fs"
import { dirname, isAbsolute, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"

import * as schema from "./db/schema.js"

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const resolveFromProjectRoot = (path: string) =>
	isAbsolute(path) ? path : resolve(projectRoot, path)

const DB_PATH = resolveFromProjectRoot(Bun.env.DB_PATH ?? "data/hermit.sqlite")
const MIGRATIONS_FOLDER = resolveFromProjectRoot(
	Bun.env.DRIZZLE_MIGRATIONS ?? "drizzle"
)

mkdirSync(dirname(DB_PATH), { recursive: true })

const sqlite = new Database(DB_PATH)
sqlite.exec("PRAGMA journal_mode = WAL;")
sqlite.exec("PRAGMA synchronous = NORMAL;")

export const db = drizzle(sqlite, { schema })

if (existsSync(MIGRATIONS_FOLDER) && Bun.env.SKIP_DB_MIGRATIONS !== "1") {
	migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
}

export { DB_PATH, sqlite }
