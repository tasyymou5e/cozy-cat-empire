import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// VAPID public key - this needs to be set as a secret
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

interface NotificationPreferences {
  friend_requests: boolean;
  gifts: boolean;
  trades: boolean;
  rewards: boolean;
  challenges: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(userId: string | undefined) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    friend_requests: true,
    gifts: true,
    trades: true,
    rewards: true,
    challenges: true,
  });
  const [loading, setLoading] = useState(true);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!isSupported || !userId) {
      setLoading(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Check if subscription exists in database
        const { data } = await supabase
          .from('push_subscriptions')
          .select('notification_preferences')
          .eq('user_id', userId)
          .eq('endpoint', subscription.endpoint)
          .single();

        if (data) {
          setIsSubscribed(true);
          const prefs = data.notification_preferences as Record<string, boolean> | null;
          if (prefs) {
            setPreferences({
              friend_requests: prefs.friend_requests ?? true,
              gifts: prefs.gifts ?? true,
              trades: prefs.trades ?? true,
              rewards: prefs.rewards ?? true,
              challenges: prefs.challenges ?? true,
            });
          }
        } else {
          setIsSubscribed(false);
        }
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [isSupported, userId]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }, [isSupported]);

  // Request permission and subscribe
  const subscribe = useCallback(async () => {
    if (!isSupported || !userId || !VAPID_PUBLIC_KEY) {
      if (!VAPID_PUBLIC_KEY) {
        toast({
          title: 'Configuration Required',
          description: 'Push notifications are not configured yet.',
          variant: 'destructive',
        });
      }
      return false;
    }

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
        return false;
      }

      const registration = await registerServiceWorker();
      if (!registration) return false;

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      const key = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!key || !auth) {
        throw new Error('Failed to get subscription keys');
      }

      const keyBase64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(key))));
      const authBase64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(auth))));
      const prefsJson = JSON.parse(JSON.stringify(preferences));

      // Save to database - check if exists first
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('push_subscriptions')
          .update({
            p256dh: keyBase64,
            auth: authBase64,
            notification_preferences: prefsJson,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from('push_subscriptions').insert([
          {
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh: keyBase64,
            auth: authBase64,
            notification_preferences: prefsJson,
          },
        ]);

        if (error) throw error;
      }

      setIsSubscribed(true);
      toast({
        title: '🔔 Notifications Enabled',
        description: "You'll receive push notifications for important events!",
      });
      return true;
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: 'Subscription Failed',
        description: 'Could not enable push notifications.',
        variant: 'destructive',
      });
      return false;
    }
  }, [isSupported, userId, registerServiceWorker, preferences]);

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    if (!isSupported || !userId) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications.',
      });
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }, [isSupported, userId]);

  // Update preferences
  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      if (!userId) return false;

      const updatedPreferences = { ...preferences, ...newPreferences };

      try {
        const { error } = await supabase
          .from('push_subscriptions')
          .update({ notification_preferences: updatedPreferences })
          .eq('user_id', userId);

        if (error) throw error;

        setPreferences(updatedPreferences);
        return true;
      } catch (error) {
        console.error('Error updating preferences:', error);
        return false;
      }
    },
    [userId, preferences]
  );

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!isSubscribed) return;

    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          title: '🔔 Test Notification',
          body: 'Push notifications are working!',
          icon: '/favicon.ico',
        },
      });

      if (error) throw error;

      toast({
        title: 'Test Sent',
        description: 'Check for your push notification!',
      });
    } catch (error) {
      console.error('Error sending test:', error);
    }
  }, [userId, isSubscribed]);

  return {
    isSupported,
    isSubscribed,
    permission,
    preferences,
    loading,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
  };
}
