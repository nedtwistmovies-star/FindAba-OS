/**
 * Location Service for FindAba (v2 - Intelligent Proximity Engine)
 * Handles spatial logic, smart filtering, and AI-ready business ranking.
 */

import { Business } from "../types";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Aba Center (Post Office)
export const ABA_CENTER: Coordinates = {
  latitude: 5.1065,
  longitude: 7.3633
};

/**
 * Convert degrees → radians
 */
const toRad = (deg: number): number => deg * Math.PI / 180;

/**
 * Haversine distance (km)
 */
export const calculateDistance = (point1: Coordinates, point2: Coordinates): number => {
  const R = 6371;

  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(point1.latitude)) *
    Math.cos(toRad(point2.latitude)) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Get user location (robust)
 */
export const getCurrentPosition = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return reject(new Error("Geolocation not supported"));
    }

    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) reject(new Error("Location timeout"));
    }, 7000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolved = true;
        clearTimeout(timeout);

        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      (err) => {
        clearTimeout(timeout);

        const messages: Record<number, string> = {
          1: "Permission denied",
          2: "Location unavailable",
          3: "Timeout"
        };

        reject(new Error(messages[err.code] || "Location error"));
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Check Aba radius
 */
export const isWithinAbaBounds = (coords: Coordinates): boolean => {
  if (!coords?.latitude || !coords?.longitude) return false;
  return calculateDistance(coords, ABA_CENTER) <= 15;
};

/**
 * Normalize text for search
 */
const normalize = (text: string = "") =>
  text.toLowerCase().trim();

/**
 * Intelligent filtering (category + keyword)
 */
export const filterBusinesses = (
  businesses: Business[],
  query?: string,
  category?: string
) => {
  return businesses.filter(b => {
    const matchesCategory = category
      ? normalize(b.category).includes(normalize(category))
      : true;

    const matchesQuery = query
      ? (
          normalize(b.name).includes(normalize(query)) ||
          normalize(b.description || "").includes(normalize(query)) ||
          normalize(b.primary_product_or_service || "").includes(normalize(query))
        )
      : true;

    return matchesCategory && matchesQuery;
  });
};

/**
 * Rank businesses by distance + relevance
 */
export const rankBusinesses = (
  userLocation: Coordinates,
  businesses: Business[]
) => {
  return businesses
    .map(b => {
      if (!b.latitude || !b.longitude) return null;

      const distance = calculateDistance(userLocation, {
        latitude: b.latitude,
        longitude: b.longitude
      });

      // scoring logic (distance weighted more)
      const score = (1 / (distance + 0.1)) * 70 + (b.verification_status === "verified" ? 30 : 10);

      return {
        ...b,
        distance,
        score
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.score - a.score);
};

/**
 * Main intelligent search function (USE THIS)
 */
export const findBestBusinesses = (
  userLocation: Coordinates,
  businesses: Business[],
  options?: {
    query?: string;
    category?: string;
    limit?: number;
  }
) => {
  const { query, category, limit = 5 } = options || {};

  const filtered = filterBusinesses(businesses, query, category);
  const ranked = rankBusinesses(userLocation, filtered);

  return ranked.slice(0, limit);
};

/**
 * Distance formatter
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  return `${distance.toFixed(1)}km`;
};

/**
 * Distance grouping (for UI / AI reasoning)
 */
export const groupByDistance = (
  businesses: (Business & { distance: number })[]
) => ({
  veryClose: businesses.filter(b => b.distance <= 1),
  nearby: businesses.filter(b => b.distance > 1 && b.distance <= 5),
  far: businesses.filter(b => b.distance > 5)
});