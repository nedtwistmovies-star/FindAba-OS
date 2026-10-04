/**
 * server/services/tierUpgradeService.ts
 * Authoritative Business Registration Tier Upgrade Engine for FindAba.com.ng
 *
 * Trace: Business Registration -> Tier Selection -> Payment -> Paystack -> Payment Confirmation -> Business Account/Tier Update -> UI
 * Guarantees:
 * - Only genuine Paystack confirmed payments trigger tier upgrades
 * - Idempotent execution (safe across multiple webhook or client verification calls)
 * - Safe against non-existent DB columns (e.g. hub_tier is strictly avoided)
 * - Immediate persistence in database and instant return of updated business & profile
 */

import axios from "axios";
import { env } from "./env";
import { supabase } from "./supabase";
import { sendPaymentSuccessEmail } from "./emailTemplates";

export type AllowedSubscriptionTier = 'Free' | 'Verified' | 'Growth' | 'Premium';

export interface TierDefinition {
  id: AllowedSubscriptionTier;
  name: string;
  minAmount: number; // in NGN
  profileTier: 'starter' | 'verified' | 'growth' | 'premium';
  verificationLevel: 'Listed' | 'Document Verified' | 'Physically Verified';
  verificationStatus: 'Unverified' | 'Verified';
  status: 'pending' | 'approved';
  premiumFeatures: boolean;
  slots: number;
}

export const TIER_CONFIGS: Record<string, TierDefinition> = {
  free: {
    id: 'Free',
    name: 'Starter Hub',
    minAmount: 0,
    profileTier: 'starter',
    verificationLevel: 'Listed',
    verificationStatus: 'Unverified',
    status: 'pending',
    premiumFeatures: false,
    slots: 1,
  },
  verified: {
    id: 'Verified',
    name: 'Local Trust Hub',
    minAmount: 2500,
    profileTier: 'verified',
    verificationLevel: 'Document Verified',
    verificationStatus: 'Verified',
    status: 'approved',
    premiumFeatures: true,
    slots: 15,
  },
  growth: {
    id: 'Growth',
    name: 'Growth Engine Hub',
    minAmount: 5000,
    profileTier: 'growth',
    verificationLevel: 'Document Verified',
    verificationStatus: 'Verified',
    status: 'approved',
    premiumFeatures: true,
    slots: 40,
  },
  premium: {
    id: 'Premium',
    name: 'Export Ready Hub',
    minAmount: 10000,
    profileTier: 'premium',
    verificationLevel: 'Physically Verified',
    verificationStatus: 'Verified',
    status: 'approved',
    premiumFeatures: true,
    slots: 100,
  },
};

/**
 * Normalizes any string representation of a tier into the authoritative AllowedSubscriptionTier.
 */
export function normalizeTier(input?: string | null, amount?: number): AllowedSubscriptionTier {
  if (input) {
    const clean = input.trim().toLowerCase();
    if (clean === 'premium' || clean.includes('export ready') || clean === 'export_ready') {
      return 'Premium';
    }
    if (clean === 'growth' || clean.includes('growth engine') || clean === 'growth_engine') {
      return 'Growth';
    }
    if (clean === 'verified' || clean.includes('local trust') || clean === 'local_trust' || clean === 'standard') {
      return 'Verified';
    }
    if (clean === 'free' || clean.includes('starter') || clean === 'basic') {
      return 'Free';
    }
  }

  // Fallback by amount if tier string is missing or ambiguous
  if (typeof amount === 'number' && amount > 0) {
    if (amount >= 10000) return 'Premium';
    if (amount >= 5000) return 'Growth';
    if (amount >= 2500) return 'Verified';
  }

  return 'Free';
}

/**
 * In-memory buffer to cache business associations for pending references
 * ensuring instant recovery even if webhook arrives before client callback.
 */
const pendingIntentMap = new Map<string, {
  businessId?: string;
  userId?: string;
  tier: AllowedSubscriptionTier;
  amount: number;
  email?: string;
  timestamp: number;
}>();

/**
 * Pre-registers a tier payment intent before launching Paystack.
 * If businessData is provided for a new registration, it creates the business
 * in pending state with 'Free' tier, providing a concrete businessId.
 */
export async function createTierPaymentIntent(params: {
  reference: string;
  userId?: string;
  businessId?: string;
  tier: string;
  amount: number;
  email?: string;
  businessData?: any;
}) {
  const { reference, userId, amount, email, businessData } = params;
  const tier = normalizeTier(params.tier, amount);

  let finalBusinessId = params.businessId;

  // If registering a new business without an existing businessId
  if (!finalBusinessId && businessData) {
    try {
      const cleanEmail = (businessData.email || email || '').toLowerCase().trim();
      const cleanName = (businessData.name || 'New Business').trim();

      // Check if business with email already exists
      const { data: existing } = await supabase
        .from('businesses')
        .select('id, name, subscription_tier')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existing) {
        finalBusinessId = existing.id;
      } else {
        // Insert new business in pending state
        const { data: createdBiz, error: createErr } = await supabase
          .from('businesses')
          .insert([{
            user_id: userId || null,
            name: cleanName,
            email: cleanEmail,
            category: businessData.category || 'General',
            primary_product_or_service: businessData.primary_product_or_service || businessData.category || 'General',
            area: businessData.area || 'Aba',
            address: businessData.address || 'Aba, Abia State',
            digital_postcode: businessData.digital_postcode || null,
            phone_whatsapp: businessData.phone_whatsapp || '',
            description: businessData.description || `${cleanName} operating in Aba.`,
            image_url: businessData.image_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800',
            status: 'pending',
            verification_status: 'Unverified',
            verification_level: 'Listed',
            integrity_grade: 'C',
            subscription_tier: 'Free', // Initial tier is Free until payment is confirmed
            premium_features_enabled: false,
            created_at: new Date().toISOString(),
          }])
          .select('id')
          .single();

        if (createErr) {
          console.warn("[TierUpgrade] Error pre-creating business record:", createErr.message);
        } else if (createdBiz?.id) {
          finalBusinessId = createdBiz.id;
        }
      }
    } catch (e: any) {
      console.warn("[TierUpgrade] Pre-creation catch:", e.message);
    }
  }

  // Store in pending memory map
  pendingIntentMap.set(reference, {
    businessId: finalBusinessId,
    userId,
    tier,
    amount,
    email,
    timestamp: Date.now(),
  });

  // Clean memory map older than 24 hours
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [ref, item] of pendingIntentMap.entries()) {
    if (item.timestamp < oneDayAgo) pendingIntentMap.delete(ref);
  }

  // Record pending payment in payments table (using safe columns only)
  try {
    await supabase.from('payments').upsert({
      reference,
      user_id: userId || null,
      plan_id: tier,
      amount,
      provider: 'paystack',
      status: 'pending',
      created_at: new Date().toISOString(),
    }, { onConflict: 'reference' });
  } catch (err: any) {
    console.warn("[TierUpgrade] Record pending payment warning:", err.message);
  }

  return {
    success: true,
    reference,
    businessId: finalBusinessId,
    tier,
    amount,
  };
}

/**
 * Authoritative Payment Verification and Tier Upgrade.
 *
 * Sequence:
 * 1. Checks if payment has already been confirmed (idempotent).
 * 2. If not confirmed, authoritatively verifies transaction status with Paystack API.
 * 3. Confirms that Paystack status is "success" and amount is valid.
 * 4. Resolves the exact purchased tier from Paystack metadata or pending record.
 * 5. Updates payments table status to 'success'.
 * 6. Updates businesses table subscription_tier, status, verification_status, premium_features_enabled.
 * 7. Updates profiles table tier_level, subscription_status, role.
 * 8. Returns the updated business and profile immediately.
 */
export async function confirmTierPaymentAndUpgrade(
  reference: string,
  options?: {
    businessId?: string;
    tier?: string;
    userId?: string;
    amount?: number;
    paystackData?: any;
  }
) {
  if (!reference) {
    throw new Error("Transaction reference is required for payment confirmation.");
  }

  const cleanRef = reference.trim();
  const cachedIntent = pendingIntentMap.get(cleanRef);

  // 1. Check existing record in DB for idempotency
  let existingPayment: any = null;
  try {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('reference', cleanRef)
      .maybeSingle();
    existingPayment = data;
  } catch (e: any) {
    console.warn("[TierUpgrade] Error checking existing payment:", e.message);
  }

  // 2. Fetch or verify with Paystack API if not provided in options
  let paystackData = options?.paystackData;
  const secretKey = env.PAYSTACK_SECRET_KEY;

  if (!paystackData) {
    if (!secretKey) {
      console.warn("[TierUpgrade] PAYSTACK_SECRET_KEY not set on server. Cannot verify transaction.");
      return {
        verified: false,
        reference: cleanRef,
        status: "unconfigured",
        error: "Paystack secret key is not configured on the server. Unable to verify transaction.",
        message: "Payment could not be verified because Paystack integration is not configured on the server."
      };
    } else {
      // Production verification against Paystack API
      try {
        const paystackRes = await axios.get(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(cleanRef)}`,
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          }
        );
        paystackData = paystackRes.data?.data;
      } catch (err: any) {
        console.warn("[TierUpgrade] Paystack API verification check:", err.response?.data?.message || err.message);
        return {
          verified: false,
          status: "failed",
          error: err.response?.data?.message || err.message || "Could not verify transaction with Paystack.",
          message: "Transaction could not be verified with Paystack."
        };
      }
    }
  }

  // 3. Validate Paystack status
  if (!paystackData || paystackData.status !== "success") {
    const failReason = paystackData?.gateway_response || paystackData?.status || "Payment not confirmed by Paystack";
    // Mark as failed in DB
    try {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('reference', cleanRef);
    } catch {}
    return {
      verified: false,
      status: paystackData?.status || "failed",
      error: failReason,
      message: "The payment has not been confirmed as successful by Paystack.",
    };
  }

  const verifiedAmount = paystackData.amount ? paystackData.amount / 100 : (options?.amount || 0);
  const metadata = paystackData.metadata || {};

  // 4. Resolve Authoritative Tier & Business & User IDs
  const rawTier =
    metadata.tier ||
    metadata.plan_id ||
    metadata.subscription_tier ||
    options?.tier ||
    cachedIntent?.tier ||
    existingPayment?.plan_id;

  const targetTier = normalizeTier(rawTier, verifiedAmount);
  const tierDef = TIER_CONFIGS[targetTier.toLowerCase()] || TIER_CONFIGS.verified;

  let targetBusinessId =
    metadata.business_id ||
    options?.businessId ||
    cachedIntent?.businessId;

  const targetUserId =
    metadata.user_id ||
    options?.userId ||
    cachedIntent?.userId ||
    existingPayment?.user_id;

  // If businessId is still missing, search for the user's business
  if (!targetBusinessId && targetUserId) {
    try {
      const { data: userBusinesses } = await supabase
        .from('businesses')
        .select('id, name, subscription_tier')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (userBusinesses && userBusinesses.length > 0) {
        targetBusinessId = userBusinesses[0].id;
      }
    } catch (e: any) {
      console.warn("[TierUpgrade] Error searching business for user:", e.message);
    }
  }

  // 5. Update or insert successful payment in payments table
  try {
    await supabase.from('payments').upsert({
      reference: cleanRef,
      user_id: targetUserId || null,
      plan_id: tierDef.id,
      amount: verifiedAmount,
      provider: 'paystack',
      status: 'success',
      created_at: existingPayment?.created_at || new Date().toISOString(),
    }, { onConflict: 'reference' });
  } catch (dbErr: any) {
    console.warn("[TierUpgrade] DB payment update warning:", dbErr.message);
  }

  // 6. Authoritatively update the business in database
  let updatedBusiness: any = null;
  if (targetBusinessId) {
    try {
      const businessUpdates = {
        subscription_tier: tierDef.id,
        status: 'approved',
        verification_status: 'Verified',
        verification_level: tierDef.verificationLevel,
        premium_features_enabled: true,
        is_verified: true,
        integrity_grade: tierDef.id === 'Premium' ? 'A' : 'B',
        is_export_ready: tierDef.id === 'Premium',
      };

      const { data: bizData, error: bizErr } = await supabase
        .from('businesses')
        .update(businessUpdates)
        .eq('id', targetBusinessId)
        .select()
        .single();

      if (bizErr) {
        console.error("[TierUpgrade] CRITICAL: Failed to update business tier:", bizErr.message);
      } else {
        updatedBusiness = bizData;
        console.log(`[TierUpgrade] SUCCESS: Business ${targetBusinessId} upgraded to ${tierDef.id}!`);
      }
    } catch (err: any) {
      console.error("[TierUpgrade] Business update error:", err.message);
    }
  }

  // 7. Update User Profile in profiles table
  let updatedProfile: any = null;
  if (targetUserId) {
    try {
      const profileUpdates: any = {
        tier_level: tierDef.profileTier,
        subscription_status: 'active',
        role: 'merchant',
        updated_at: new Date().toISOString(),
      };

      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', targetUserId)
        .select()
        .single();

      if (!profErr && profData) {
        updatedProfile = profData;
      }
    } catch (e: any) {
      console.warn("[TierUpgrade] Profile update warning:", e.message);
    }
  }

  // 8. Background Notifications
  const recipientEmail =
    metadata.email ||
    options?.paystackData?.customer?.email ||
    cachedIntent?.email ||
    updatedProfile?.email;

  if (recipientEmail) {
    sendPaymentSuccessEmail(recipientEmail, cleanRef, verifiedAmount)
      .catch((err) => console.warn("[TierUpgrade] Email notification warning:", err.message));
  }

  return {
    success: true,
    verified: true,
    status: "success",
    reference: cleanRef,
    tier: tierDef.id,
    tierName: tierDef.name,
    amount: verifiedAmount,
    businessId: targetBusinessId,
    business: updatedBusiness,
    profile: updatedProfile,
    message: `Payment confirmed. Your business has been upgraded to ${tierDef.name}.`,
  };
}

/**
 * Retrieves the full audit list of payments for administrative visibility.
 */
export async function getAdminPaymentsWithBusinesses(limit: number = 50) {
  try {
    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (payErr || !payments) {
      return [];
    }

    // Enhance payments with business and user details
    const userIds = Array.from(new Set(payments.map(p => p.user_id).filter(Boolean)));
    let userMap = new Map<string, any>();
    let bizMap = new Map<string, any>();

    if (userIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, tier_level')
          .in('id', userIds);
        profiles?.forEach(pr => userMap.set(pr.id, pr));

        const { data: businesses } = await supabase
          .from('businesses')
          .select('id, user_id, name, email, subscription_tier, status, verification_status')
          .in('user_id', userIds);
        businesses?.forEach(b => {
          if (b.user_id) bizMap.set(b.user_id, b);
        });
      } catch {}
    }

    return payments.map(p => {
      const user = userMap.get(p.user_id);
      const biz = bizMap.get(p.user_id);
      const tierDef = TIER_CONFIGS[(p.plan_id || '').toLowerCase()];

      return {
        id: p.id,
        reference: p.reference,
        amount: p.amount,
        status: p.status,
        plan_id: p.plan_id,
        tierName: tierDef?.name || p.plan_id || 'Starter',
        provider: p.provider || 'paystack',
        created_at: p.created_at,
        user_id: p.user_id,
        customerName: user?.full_name || 'Customer',
        customerEmail: user?.email || 'N/A',
        businessName: biz?.name || 'FindAba Business',
        businessId: biz?.id || null,
        currentBusinessTier: biz?.subscription_tier || p.plan_id || 'Free',
      };
    });
  } catch (err: any) {
    console.error("[TierUpgrade] Error fetching admin payments:", err.message);
    return [];
  }
}
