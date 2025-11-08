/**
 * Outbox Writer for Domain Events
 * Implements the Transactional Outbox pattern
 */

import { PrismaClient, Prisma } from '@prisma/client';

export interface OutboxEvent {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
}

export class OutboxWriter {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Append event to outbox
   * Should be called within the same transaction as the aggregate change
   */
  async append(event: OutboxEvent): Promise<void> {
    await this.prisma.domainOutbox.create({
      data: {
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payloadJsonb: event.payload,
      },
    });
  }

  /**
   * Append multiple events to outbox
   */
  async appendMany(events: OutboxEvent[]): Promise<void> {
    await this.prisma.domainOutbox.createMany({
      data: events.map((event) => ({
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payloadJsonb: event.payload,
      })),
    });
  }

  /**
   * Get unprocessed events
   */
  async getUnprocessed(limit = 100): Promise<
    Array<{
      id: string;
      aggregateType: string;
      aggregateId: string;
      eventType: string;
      payloadJsonb: Prisma.JsonValue;
      createdAt: Date;
    }>
  > {
    return this.prisma.domainOutbox.findMany({
      where: {
        processedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Mark event as processed
   */
  async markProcessed(id: string): Promise<void> {
    await this.prisma.domainOutbox.update({
      where: { id },
      data: {
        processedAt: new Date(),
      },
    });
  }

  /**
   * Mark multiple events as processed
   */
  async markManyProcessed(ids: string[]): Promise<void> {
    await this.prisma.domainOutbox.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        processedAt: new Date(),
      },
    });
  }
}