/**
 * Base Domain Event interface
 */

export interface DomainEvent {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly aggregateType: string;
  public readonly aggregateId: string;
  public readonly eventType: string;
  public readonly occurredAt: Date;
  public readonly payload: Record<string, unknown>;

  constructor(
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: Record<string, unknown>
  ) {
    this.aggregateType = aggregateType;
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.occurredAt = new Date();
    this.payload = payload;
  }
}

// R1 Spec - Domain Event Factory
export class DomainEventFactory {
  static create(
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: Record<string, unknown>
  ): DomainEvent {
    return {
      aggregateType,
      aggregateId,
      eventType,
      payload,
      occurredAt: new Date(),
    };
  }
}