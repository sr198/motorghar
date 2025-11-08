/**
 * Coordinates Value Object
 */

import { ValueObject } from '../base/value-object.js';

interface CoordinatesProps {
  latitude: number;
  longitude: number;
}

export class Coordinates extends ValueObject<CoordinatesProps> {
  private constructor(props: CoordinatesProps) {
    super(props);
  }

  get latitude(): number {
    return this.props.latitude;
  }

  get longitude(): number {
    return this.props.longitude;
  }

  public static create(
    latitude: number,
    longitude: number
  ): Coordinates | Error {
    if (latitude < -90 || latitude > 90) {
      return new Error('Latitude must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      return new Error('Longitude must be between -180 and 180');
    }

    return new Coordinates({ latitude, longitude });
  }

  /**
   * Calculate distance to another coordinate in kilometers (Haversine formula)
   */
  public distanceTo(other: Coordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(other.latitude - this.latitude);
    const dLon = this.toRad(other.longitude - this.longitude);
    const lat1 = this.toRad(this.latitude);
    const lat2 = this.toRad(other.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) *
        Math.sin(dLon / 2) *
        Math.cos(lat1) *
        Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}