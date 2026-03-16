import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Reads tracking config from game_config and injects GA4 / Meta Pixel scripts.
 * Fires pageview events on every route change.
 */
export function TrackingScripts() {
  const location = useLocation();

  const { data: config } = useQuery({
    queryKey: ['tracking-config-public'],
    queryFn: async () => {
      const { data } = await supabase
        .from('game_config')
        .select('key, value')
        .eq('category', 'tracking');

      const result: Record<string, any> = {};
      for (const row of data || []) {
        result[row.key] = row.value;
      }
      return result;
    },
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  // Inject GA4
  useEffect(() => {
    if (!config?.ga4_enabled || !config?.ga4_measurement_id) return;
    const id = String(config.ga4_measurement_id).replace(/^"|"$/g, '');
    if (!/^G-[A-Z0-9]+$/.test(id)) return;
    if (document.getElementById('ga4-script')) return;

    const script = document.createElement('script');
    script.id = 'ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    const inline = document.createElement('script');
    inline.id = 'ga4-inline';
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}', { send_page_view: false });
    `;
    document.head.appendChild(inline);
  }, [config?.ga4_enabled, config?.ga4_measurement_id]);

  // Inject Meta Pixel
  useEffect(() => {
    if (!config?.meta_pixel_enabled || !config?.meta_pixel_id) return;
    const id = String(config.meta_pixel_id).replace(/^"|"$/g, '');
    if (!/^\d{10,20}$/.test(id)) return;
    if (document.getElementById('meta-pixel-script')) return;

    const script = document.createElement('script');
    script.id = 'meta-pixel-script';
    script.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${id}');
    `;
    document.head.appendChild(script);
  }, [config?.meta_pixel_enabled, config?.meta_pixel_id]);

  // Track route changes
  useEffect(() => {
    if (!config) return;

    // GA4 pageview
    if (config.ga4_enabled && config.ga4_measurement_id && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'page_view', {
        page_path: location.pathname,
        page_title: document.title,
      });
    }

    // Meta Pixel pageview
    if (config.meta_pixel_enabled && config.meta_pixel_id && typeof (window as any).fbq === 'function') {
      (window as any).fbq('track', 'PageView');
    }
  }, [location.pathname, config]);

  return null;
}
