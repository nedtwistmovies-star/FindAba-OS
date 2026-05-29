
import { getSupabase } from '../../services/supabaseService';
import { OnboardingStage } from '../store/useOnboardingStore';
import { triggerWebhook, WebhookEvent } from '../../services/webhookService';

export const onboardingService = {
  async trackEvent(eventName: string, metadata: any = {}) {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    
    // 1. Sync to Supabase
    await supabase.from('onboarding_events').insert({
      user_id: session?.user?.id || null,
      event_type: eventName,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    });

    // 2. Trigger External Automation (Make.com)
    // Map event string to enum if possible, or use a generic audit event
    const webhookEvent = eventName === 'completed_onboarding' ? WebhookEvent.NEW_REGISTRATION : WebhookEvent.SYSTEM_AUDIT;
    
    await triggerWebhook(webhookEvent, metadata, {
      user_id: session?.user?.id,
      email: session?.user?.email,
      tier_level: metadata.type === 'merchant' ? 'premium' : 'standard'
    });

    // Also update profile if authenticated
    if (session?.user && metadata.stage) {
      await supabase.from('profiles').update({
        onboarding_stage: metadata.stage
      }).eq('id', session.user.id);
    }
  },

  async updateStage(stage: OnboardingStage) {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('profiles').update({
        onboarding_stage: stage
      }).eq('id', session.user.id);
    }
    
    await this.trackEvent(`stage_changed_${stage}`, { stage });
  },

  async completeMerchantOnboarding(userId: string, businessData: any) {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error: bizError } = await supabase.from('businesses').insert({
      ...businessData,
      user_id: userId,
      onboarding_completed: true,
      profile_completion: 100
    });

    if (bizError) throw bizError;

    const { error: profileError } = await supabase.from('profiles').update({
      onboarding_stage: 'completed',
      role: 'merchant'
    }).eq('id', userId);

    if (profileError) throw profileError;
    
    await this.trackEvent('completed_onboarding', { 
      type: 'merchant', 
      ...businessData 
    });
  }
};
