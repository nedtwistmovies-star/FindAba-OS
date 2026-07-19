import { supabase } from "../lib/supabase";
import { Business } from "../types";

export class BusinessRepository {

    static async create(payload: Partial<Business>): Promise<Business> {

        const { data, error } = await supabase
            .from("businesses")
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        return data as Business;

    }

    static async update(id: string, payload: Partial<Business>) {

        const { data, error } = await supabase
            .from("businesses")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return data as Business;

    }

    static async delete(id: string) {

        const { error } = await supabase
            .from("businesses")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return true;

    }

    static async findById(id: string) {

        const { data, error } = await supabase
            .from("businesses")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;

        return data as Business;

    }

    static async findByOwner(ownerId: string) {

        const { data, error } = await supabase
            .from("businesses")
            .select("*")
            .eq("owner_id", ownerId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data as Business[];

    }

    static async search(keyword: string) {

        const { data, error } = await supabase
            .from("businesses")
            .select("*")
            .or(
                `name.ilike.%${keyword}%,
description.ilike.%${keyword}%,
category.ilike.%${keyword}%,
market_zone.ilike.%${keyword}%`
            );

        if (error) throw error;

        return data as Business[];

    }

    static async featured(limit = 20) {

        const { data, error } = await supabase
            .from("businesses")
            .select("*")
            .eq("featured", true)
            .limit(limit);

        if (error) throw error;

        return data as Business[];

    }

    static async verified(limit = 50) {

        const { data, error } = await supabase
            .from("businesses")
            .select("*")
            .eq("verified", true)
            .limit(limit);

        if (error) throw error;

        return data as Business[];

    }

    static async nearby(lat: number, lng: number) {

        const { data, error } = await supabase
            .rpc("find_nearby_businesses", {
                user_lat: lat,
                user_lng: lng
            });

        if (error) throw error;

        return data ?? [];

    }

    static async incrementReview(id: string) {

        const business = await this.findById(id);

        return this.update(id, {

            review_count: (business.review_count || 0) + 1

        });

    }

    static async setFeatured(id: string, featured: boolean) {

        return this.update(id, {

            featured

        });

    }

    static async updateRating(id: string, rating: number) {

        return this.update(id, {

            rating

        });

    }

}
