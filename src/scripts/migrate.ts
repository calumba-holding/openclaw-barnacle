import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import { dirname, isAbsolute, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { db } from "../db.js"

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const configuredMigrationsFolder = Bun.env.DRIZZLE_MIGRATIONS ?? "drizzle"
const migrationsFolder = isAbsolute(configuredMigrationsFolder)
	? configuredMigrationsFolder
	: resolve(projectRoot, configuredMigrationsFolder)

migrate(db, { migrationsFolder })

console.log(`Applied migrations from ${migrationsFolder}.`)
