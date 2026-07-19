import { Business } from "../../types";
import { BusinessRepository } from "../../repositories/BusinessRepository";
import { StorageService } from "../storage/StorageService";

export interface BusinessRegistrationPayload {

    business: Partial<Business>;

    logo?: File;

    coverImage?: File;

    gallery?: File[];

}

export class BusinessRegistrationService {

    static async register(payload: BusinessRegistrationPayload) {

        try {

            //----------------------------------------------------
            // STEP 1
            // Create Business
            //----------------------------------------------------

            let business = await BusinessRepository.create({

                ...payload.business,

                onboarding_completed: false,

                onboarding_step: 1,

                profile_completion: 20,

                verified: false,

                review_count: 0,

                rating: 5,

                featured: false,

                created_at: new Date().toISOString()

            });

            //----------------------------------------------------
            // STEP 2
            // Upload Logo
            //----------------------------------------------------

            if (payload.logo) {

                const logoUrl =
                    await StorageService.uploadBusinessLogo(
                        payload.logo,
                        business.id
                    );

                business = await BusinessRepository.update(
                    business.id,
                    {
                        image_url: logoUrl
                    }
                );

            }

            //----------------------------------------------------
            // STEP 3
            // Upload Cover
            //----------------------------------------------------

            if (payload.coverImage) {

                const coverUrl =
                    await StorageService.uploadCoverImage(
                        payload.coverImage,
                        business.id
                    );

                business =
                    await BusinessRepository.update(
                        business.id,
                        {
                            cover_image_url: coverUrl
                        }
                    );

            }

            //----------------------------------------------------
            // STEP 4
            // Upload Gallery
            //----------------------------------------------------

            if (
                payload.gallery &&
                payload.gallery.length > 0
            ) {

                const galleryUrls =
                    await StorageService.uploadGallery(

                        payload.gallery,

                        business.id

                    );

                business =
                    await BusinessRepository.update(
                        business.id,
                        {
                            gallery_urls: galleryUrls,
                            profile_completion: 80
                        }
                    );

            }

            //----------------------------------------------------
            // STEP 5
            // Finish
            //----------------------------------------------------

            business =
                await BusinessRepository.update(
                    business.id,
                    {

                        onboarding_completed: true,

                        onboarding_step: 5,

                        profile_completion: 100

                    }
                );

            return {

                success: true,

                business

            };

        }

        catch (error) {

            console.error
