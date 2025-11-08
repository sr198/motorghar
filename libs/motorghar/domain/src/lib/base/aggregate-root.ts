/**
 * Aggregate Root base class
 * Aggregates are clusters of domain objects that can be treated as a single unit
 */

import { Entity } from './entity.js';
import { DomainEvent } from './domain-event.js';

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}