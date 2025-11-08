/**
 * Rating Value Object (1-5 stars)
 */

import { ValueObject } from '../base/value-object.js';

interface RatingProps {
  value: number;
}

export class Rating extends ValueObject<RatingProps> {
  private constructor(props: RatingProps) {
    super(props);
  }

  get value(): number {
    return this.props.value;
  }

  public static create(value: number): Rating | Error {
    if (!Number.isInteger(value)) {
      return new Error('Rating must be an integer');
    }

    if (value < 1 || value > 5) {
      return new Error('Rating must be between 1 and 5');
    }

    return new Rating({ value });
  }

  public isPositive(): boolean {
    return this.value >= 4;
  }

  public isNegative(): boolean {
    return this.value <= 2;
  }

  public isNeutral(): boolean {
    return this.value === 3;
  }
}