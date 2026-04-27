import { drizzle } from "drizzle-orm/d1"
import { getRuntimeEnv } from "./runtime/env.js"
import * as schema from "./db/schema.js"

export const getDb = () => drizzle(getRuntimeEnv().DB, { schema })
