import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

type TutorialEventType = 
  | 'step_viewed'
  | 'step_skipped'
  | 'section_jumped'
  | 'completed'
  | 'abandoned';

interface TutorialEvent {
  event_type: TutorialEventType;
  step_index?: number;
  step_id?: string;
  from_step?: number;
  to_step?: number;
  section?: string;
  time_on_step_ms?: number;
  total_time_ms?: number;
  metadata?: Record<string, unknown>;
}

// Generate a session ID for this tutorial session
const generateSessionId = () => `tutorial_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export function useTutorialAnalytics() {
  const { user } = useAuth();
  const sessionIdRef = useRef<string>(generateSessionId());
  const sessionStartRef = useRef<number>(Date.now());
  const stepStartRef = useRef<number>(Date.now());
  const lastStepRef = useRef<number>(0);

  // Reset session on mount
  useEffect(() => {
    sessionIdRef.current = generateSessionId();
    sessionStartRef.current = Date.now();
    stepStartRef.current = Date.now();
    lastStepRef.current = 0;
  }, []);

  const trackEvent = useCallback(async (event: TutorialEvent) => {
    const now = Date.now();
    const timeOnStep = now - stepStartRef.current;
    const totalTime = now - sessionStartRef.current;

    try {
      await supabase.from('tutorial_analytics').insert({
        user_id: user?.id || null,
        session_id: sessionIdRef.current,
        event_type: event.event_type,
        step_index: event.step_index ?? null,
        step_id: event.step_id ?? null,
        from_step: event.from_step ?? null,
        to_step: event.to_step ?? null,
        section: event.section ?? null,
        time_on_step_ms: event.time_on_step_ms ?? timeOnStep,
        total_time_ms: event.total_time_ms ?? totalTime,
        metadata: (event.metadata || {}) as Json,
      });
    } catch (error) {
      // Fail silently - don't interrupt tutorial flow
      console.error('Failed to track tutorial event:', error);
    }
  }, [user?.id]);

  const trackStepViewed = useCallback((stepIndex: number, stepId: string) => {
    const previousStep = lastStepRef.current;
    const timeOnPreviousStep = Date.now() - stepStartRef.current;
    
    // Track if user skipped steps (jumped forward by more than 1)
    if (stepIndex > previousStep + 1 && previousStep > 0) {
      trackEvent({
        event_type: 'step_skipped',
        from_step: previousStep,
        to_step: stepIndex,
        metadata: { skipped_count: stepIndex - previousStep - 1 }
      });
    }

    trackEvent({
      event_type: 'step_viewed',
      step_index: stepIndex,
      step_id: stepId,
      time_on_step_ms: previousStep > 0 ? timeOnPreviousStep : 0,
    });

    // Update refs for next step
    stepStartRef.current = Date.now();
    lastStepRef.current = stepIndex;
  }, [trackEvent]);

  const trackSectionJump = useCallback((fromStep: number, toStep: number, section: string) => {
    const timeOnStep = Date.now() - stepStartRef.current;
    
    trackEvent({
      event_type: 'section_jumped',
      from_step: fromStep,
      to_step: toStep,
      section,
      time_on_step_ms: timeOnStep,
    });

    stepStartRef.current = Date.now();
    lastStepRef.current = toStep;
  }, [trackEvent]);

  const trackCompleted = useCallback((finalStep: number) => {
    trackEvent({
      event_type: 'completed',
      step_index: finalStep,
      total_time_ms: Date.now() - sessionStartRef.current,
    });
  }, [trackEvent]);

  const trackAbandoned = useCallback((currentStep: number, stepId: string) => {
    const timeOnStep = Date.now() - stepStartRef.current;
    
    trackEvent({
      event_type: 'abandoned',
      step_index: currentStep,
      step_id: stepId,
      time_on_step_ms: timeOnStep,
      total_time_ms: Date.now() - sessionStartRef.current,
    });
  }, [trackEvent]);

  return {
    trackStepViewed,
    trackSectionJump,
    trackCompleted,
    trackAbandoned,
  };
}
