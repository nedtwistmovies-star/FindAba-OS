import { supabase } from "../../lib/supabase";

export class StorageService {

    static async uploadBusinessLogo(file: File, businessId: string) {

        const extension = file.name.split(".").pop();

        const path = `businesses/${businessId}/logo.${extension}`;

        const { error } = await supabase.storage
            .from("business-assets")
            .upload(path, file, {
                cacheControl: "3600",
                upsert: true,
            });

        if (error) throw error;

        return this.getPublicUrl(path);

    }

    static async uploadCoverImage(file: File, businessId: string) {

        const extension = file.name.split(".").pop();

        const path = `businesses/${businessId}/cover.${extension}`;

        const { error } = await supabase.storage
            .from("business-assets")
            .upload(path, file, {
                cacheControl: "3600",
                upsert: true,
            });

        if (error) throw error;

        return this.getPublicUrl(path);

    }

    static async uploadGallery(files: File[], businessId: string) {

        const urls: string[] = [];

        for (const file of files) {

            const extension = file.name.split(".").pop();

            const filename = `${crypto.randomUUID()}.${extension}`;

            const path = `businesses/${businessId}/gallery/${filename}`;

            const { error } = await supabase.storage
                .from("business-assets")
                .upload(path, file, {
                    cacheControl: "3600",
                    upsert: true,
                });

            if (error) throw error;

            urls.push(this.getPublicUrl(path));

        }

        return urls;

    }

    static async uploadAvatar(file: File, userId: string) {

        const extension = file.name.split(".").pop();

        const path = `avatars/${userId}.${extension}`;

        const { error } = await supabase.storage
            .from("avatars")
            .upload(path, file, {
                cacheControl: "3600",
                upsert: true,
            });

        if (error) throw error;

        return this.getPublicUrl(path);

    }

    static async uploadProductImage(file: File, businessId: string) {

        const extension = file.name.split(".").pop();

        const filename = `${crypto.randomUUID()}.${extension}`;

        const path = `products/${businessId}/${filename}`;

        const { error } = await supabase.storage
            .from("products")
            .upload(path, file, {
                cacheControl: "3600",
                upsert: true,
            });

        if (error) throw error;

        return this.getPublicUrl(path);

    }

    static async uploadEventBanner(file: File, eventId: string) {

        const extension = file.name.split(".").pop();

        const path = `events/${eventId}.${extension}`;

        const { error } = await supabase.storage
            .from("events")
            .upload(path, file, {
                cacheControl: "3600",
                upsert: true,
            });

        if (error) throw error;

        return this.getPublicUrl(path);

    }

    static async delete(path: string, bucket: string) {

        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) throw error;

        return true;

    }

    static getPublicUrl(path: string, bucket = "business-assets") {

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return data.publicUrl;

    }

}
