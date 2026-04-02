
import { ShipmentStatus } from '../types';

export interface LogisticsQuote {
  carrier: string;
  serviceName: string;
  price: number;
  estimatedDays: number;
  tier: 'standard' | 'express' | 'premium';
}

export interface TrackingEvent {
  status: ShipmentStatus;
  location: string;
  timestamp: string;
  description: string;
}

export interface ShipmentDetails {
  trackingId: string;
  carrier: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  weight: number;
  events: TrackingEvent[];
  estimatedDelivery: string;
}

const CARRIERS = [
  { name: 'Carry-Go Express', basePrice: 1500, multiplier: 1.2 },
  { name: 'DHL Enyimba', basePrice: 4500, multiplier: 2.5 },
  { name: 'Purple Fleet Logistics', basePrice: 3000, multiplier: 1.8 }
];

export const calculateLogisticsQuotes = (weight: number): LogisticsQuote[] => {
  return CARRIERS.map(carrier => ({
    carrier: carrier.name,
    serviceName: weight > 10 ? 'Heavy Freight' : 'Parcel Sync',
    price: Math.round(carrier.basePrice + (weight * 200 * carrier.multiplier)),
    estimatedDays: carrier.name.includes('Express') ? 1 : 3,
    tier: carrier.name.includes('Express') ? 'express' : carrier.name.includes('DHL') ? 'premium' : 'standard'
  }));
};

export const generateTrackingId = (carrier: string): string => {
  const prefix = carrier.substring(0, 2).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}`;
};

export const getMockTrackingDetails = (trackingId: string, carrier: string = 'DHL Enyimba'): ShipmentDetails => {
  return {
    trackingId,
    carrier,
    status: 'in-transit',
    origin: 'Ariaria Industrial Hub, Aba',
    destination: 'Lagos Island Perimeter',
    weight: 5.5,
    estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
    events: [
      {
        status: 'requested',
        location: 'Ariaria Node',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        description: 'Shipment information received'
      },
      {
        status: 'pickup-scheduled',
        location: 'Ariaria Node',
        timestamp: new Date(Date.now() - 72000000).toISOString(),
        description: 'Courier assigned for pickup'
      },
      {
        status: 'at-hub',
        location: 'Aba Central Sorting',
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        description: 'Arrived at sorting facility'
      },
      {
        status: 'in-transit',
        location: 'Enugu Expressway',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        description: 'Departed sorting facility'
      }
    ]
  };
};
