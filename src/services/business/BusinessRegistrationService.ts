import { BusinessRepository } from "../../repositories/BusinessRepository";
import type { Business } from "../../types";

export interface RegisterBusinessRequest {
  name: string;
  description?: string;
  category: string;
  owner_id: string;
  phone?: string;
  email?: string;
  address?: string;
  market_zone?: string;
  latitude?: number;
  longitude?: number;
  logo_url?: string;
}

export class BusinessRegistrationService {

  static async registerBusiness(
    payload: RegisterBusinessRequest
  ): Promise<Business> {

    // Required fields
    if (!payload.name?.trim()) {
      throw new Error("Business name is required.");
    }

    if (!payload.category?.trim()) {
      throw new Error("Business category is required.");
    }

    if (!payload.owner_id) {
      throw new Error("Business owner is missing.");
    }

    // Prevent duplicate registration
    const existingBusinesses =
      await BusinessRepository.findByOwner(payload.owner_id);

    if (existingBusinesses.length > 0) {
      throw new Error(
        "You already have a registered business."
      );
    }

    const business: Partial<Business> = {
      ...payload,

      verified: false,

      featured: false,

      rating: 0,

      review_count: 0,

      created_at: new Date().toISOString(),

      updated_at: new Date().toISOString()
    };

    return await BusinessRepository.create(business);
  }

  static async updateBusiness(
    id: string,
    payload: Partial<Business>
  ) {

    payload.updated_at = new Date().toISOString();

    return await BusinessRepository.update(
      id,
      payload
    );
  }

  static async deleteBusiness(id: string) {

    return await BusinessRepository.delete(id);

  }

  static async getBusiness(id: string) {

    return await BusinessRepository.findById(id);

  }

  static async getMyBusiness(ownerId: string) {

    const businesses =
      await BusinessRepository.findByOwner(ownerId);

    return businesses.length
      ? businesses[0]
      : null;
  }

  static async searchBusinesses(keyword: string) {

    return await BusinessRepository.search(keyword);

  }

  static async getFeaturedBusinesses() {

    return await BusinessRepository.featured();

  }

  static async getVerifiedBusinesses() {

    return await BusinessRepository.verified();

  }

}
