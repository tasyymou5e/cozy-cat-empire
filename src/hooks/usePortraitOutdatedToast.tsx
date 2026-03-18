import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Cat } from '@/types/game';

import { createLogger } from '@/lib/logger';

const logger = createLogger('usePortraitOutdatedToast');

/**
 * Hook that shows a toast notification when a cat's portrait becomes outdated
 * after appearance or costume changes. Includes a quick action to navigate
 * to the photo booth for regeneration.
 */
export function usePortraitOutdatedToast() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const showOutdatedToast = (cat: Cat) => {
    try {
      toast({
        title: 'Portrait Outdated',
        description: `${cat.name}'s appearance has changed. The AI portrait no longer matches.`,
        action: (
          <ToastAction altText="Update Portrait" onClick={() => navigate(`/photobooth/${cat.id}`)}>
            Update Portrait
          </ToastAction>
        ),
      });
    } catch (error) {
      logger.warn('Toast notification failed:', error);
    }
  };

  return { showOutdatedToast };
}
