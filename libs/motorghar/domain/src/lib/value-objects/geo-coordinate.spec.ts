import { GeoCoordinate } from './geo-coordinate';

describe('GeoCoordinate', () => {
  describe('create', () => {
    it('should create valid coordinate', () => {
      const coord = GeoCoordinate.create(27.7172, 85.3240);
      expect(coord.latitude).toBe(27.7172);
      expect(coord.longitude).toBe(85.3240);
    });

    it('should throw on invalid latitude', () => {
      expect(() => GeoCoordinate.create(91, 85)).toThrow();
      expect(() => GeoCoordinate.create(-91, 85)).toThrow();
    });

    it('should throw on invalid longitude', () => {
      expect(() => GeoCoordinate.create(27, 181)).toThrow();
      expect(() => GeoCoordinate.create(27, -181)).toThrow();
    });
  });

  describe('toPostGIS', () => {
    it('should format as PostGIS POINT', () => {
      const coord = GeoCoordinate.create(27.7172, 85.3240);
      expect(coord.toPostGIS()).toBe('POINT(85.324 27.7172)');
    });
  });

  describe('fromString', () => {
    it('should parse PostGIS POINT', () => {
      const coord = GeoCoordinate.fromString('POINT(85.324 27.7172)');
      expect(coord.latitude).toBe(27.7172);
      expect(coord.longitude).toBe(85.324);
    });
  });

  describe('toJSON', () => {
    it('should return JSON object', () => {
      const coord = GeoCoordinate.create(27.7172, 85.3240);
      expect(coord.toJSON()).toEqual({
        latitude: 27.7172,
        longitude: 85.3240,
      });
    });
  });
});