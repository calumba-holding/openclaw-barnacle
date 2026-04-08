ALTER TABLE tracked_threads
ADD COLUMN warning_level INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE tracked_threads
ADD COLUMN closed INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE tracked_threads
ADD COLUMN last_message_count INTEGER;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tracked_threads_closed ON tracked_threads(closed);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tracked_threads_warning_level ON tracked_threads(warning_level);
