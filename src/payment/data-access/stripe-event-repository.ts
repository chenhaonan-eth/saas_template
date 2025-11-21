import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDb } from '@/db';
import { stripeEvent } from '@/db/schema';

import type * as schema from '@/db/schema';

type Transaction =
  | (Parameters<BetterSQLite3Database<typeof schema>['transaction']>[0] extends (
        arg: infer A,
      ) => unknown
        ? A
        : never)
  | (Parameters<DrizzleD1Database<typeof schema>['transaction']>[0] extends (
        arg: infer A,
      ) => unknown
        ? A
        : never);

export class StripeEventRepository {
  async find(eventId: string) {
    const db = await getDb();
    const result = await db
      .select()
      .from(stripeEvent)
      .where(eq(stripeEvent.eventId, eventId))
      .limit(1);
    return result[0];
  }

  async record(event: {
    eventId: string;
    type: string;
    createdAt: Date;
  }): Promise<void> {
    const db = await getDb();
    await db
      .insert(stripeEvent)
      .values(event)
      .onConflictDoNothing({ target: stripeEvent.eventId });
  }

  async markProcessed(eventId: string): Promise<void> {
    const db = await getDb();
    await db
      .update(stripeEvent)
      .set({ processedAt: new Date() })
      .where(eq(stripeEvent.eventId, eventId));
  }

  async withEventProcessingLock<T>(
    event: { eventId: string; type: string; createdAt: Date },
    handler: () => Promise<T>
  ): Promise<{ skipped: boolean; result?: T }> {
    const db = await getDb();
    const processEvent = async (tx: Transaction) => {
      await tx
        .insert(stripeEvent)
        .values(event)
        .onConflictDoNothing({ target: stripeEvent.eventId });

      const result = await tx
        .select()
        .from(stripeEvent)
        .where(eq(stripeEvent.eventId, event.eventId))
        .limit(1);
      const record = result[0];
      if (!record) {
        throw new Error('Failed to load stripe event record');
      }
      if (record.processedAt) {
        return { skipped: true as const };
      }
      const handlerResult = await handler();
      await tx
        .update(stripeEvent)
        .set({ processedAt: new Date() })
        .where(eq(stripeEvent.eventId, event.eventId));
      return { skipped: false as const, result: handlerResult };
    };

    if (isD1Database(db)) {
      return db.transaction(async (tx) => processEvent(tx));
    }
    return db.transaction((tx) => processEvent(tx));
  }
}

function isD1Database(
  db: BetterSQLite3Database<typeof schema> | DrizzleD1Database<typeof schema>
): db is DrizzleD1Database<typeof schema> {
  return typeof (db as { batch?: unknown }).batch === 'function';
}
