/**
 * Base Domain Event interface
 */

export interface DomainEvent {
  aggregateId: string;
  eventType: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly aggregateId: string;
  public readonly eventType: string;
  public readonly occurredAt: Date;
  public readonly payload: Record<string, unknown>;

  constructor(
    aggregateId: string,
    eventType: string,
    payload: Record<string, unknown>
  ) {
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.occurredAt = new Date();
    this.payload = payload;
  }
}