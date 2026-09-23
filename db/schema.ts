import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const dailyMetrics = sqliteTable('daily_metrics', {
  day: text('day').notNull(),
  event: text('event').notNull(),
  count: integer('count').notNull().default(0),
}, table => [primaryKey({ columns: [table.day, table.event] })]);

export const feedback = sqliteTable('feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: text('created_at').notNull(),
  category: text('category').notNull(),
  message: text('message').notNull(),
});
