/**
 * GeoCoordinate Value Object for PostGIS support (R1 Spec)
 */

export class GeoCoordinate {
  private constructor(
    public readonly latitude: number,
    public readonly longitude: number
  ) {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
  }

  static create(latitude: number, longitude: number): GeoCoordinate {
    return new GeoCoordinate(latitude, longitude);
  }

  static fromString(geoString: string): GeoCoordinate {
    // Parse PostGIS point format: "POINT(lng lat)"
    const match = geoString.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (!match) {
      throw new Error('Invalid geo string format');
    }
    return new GeoCoordinate(parseFloat(match[2]), parseFloat(match[1]));
  }

  toPostGIS(): string {
    return `POINT(${this.longitude} ${this.latitude})`;
  }

  toJSON(): { latitude: number; longitude: number } {
    return { latitude: this.latitude, longitude: this.longitude };
  }
}