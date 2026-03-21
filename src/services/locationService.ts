
/**
 * Location Service for FindAba
 * Handles spatial logic for the Enyimba Industrial Hub.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Center of Aba (Post Office area)
export const ABA_CENTER: Coordinates = {
  latitude: 5.1065,
  longitude: 7.3633
};

/**
 * Calculates distance between two points in Kilometers using Haversine formula.
 */
export const calculateDistance = (point1: Coordinates, point2: Coordinates): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Requests browser geolocation with a timeout and high accuracy.
 */
export const getCurrentPosition = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};

/**
 * Checks if a location is within the greater Aba industrial zone.
 */
export const isWithinAbaBounds = (coords: Coordinates): boolean => {
  const distance = calculateDistance(coords, ABA_CENTER);
  return distance <= 15; // 15km radius from center
};
