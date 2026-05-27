
import { getSupabase } from '../../services/supabaseService';
import { OnboardingStage } from '../store/useOnboardingStore';

export const onboardingService = {
  async trackEvent(eventName: string, metadata: any = {}) {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    
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
    
    await this.trackEvent('completed_onboarding', { type: 'merchant' });
  }
};
