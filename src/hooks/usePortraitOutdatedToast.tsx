import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Cat } from '@/types/game';

/**
 * Hook that shows a toast notification when a cat's portrait becomes outdated
 * after appearance or costume changes. Includes a quick action to navigate
 * to the photo booth for regeneration.
 */
export function usePortraitOutdatedToast() {
  const navigate = useNavigate();

  const showOutdatedToast = (cat: Cat) => {
    toast({
      title: 'Portrait Outdated',
      description: `${cat.name}'s appearance has changed. The AI portrait no longer matches.`,
      action: (
        <ToastAction altText="Update Portrait" onClick={() => navigate(`/photobooth/${cat.id}`)}>
          Update Portrait
        </ToastAction>
      ),
    });
  };

  return { showOutdatedToast };
}
