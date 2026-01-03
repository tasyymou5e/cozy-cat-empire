import { Skeleton } from '@/components/ui/skeleton';

interface CatCardSkeletonProps {
  compact?: boolean;
}

export function CatCardSkeleton({ compact = false }: CatCardSkeletonProps) {
  if (compact) {
    return (
      <div className="cat-card">
        <Skeleton className="w-12 h-12 rounded-full mb-2" />
        <Skeleton className="h-4 w-16 mb-1" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
    );
  }

  return (
    <div className="cat-card space-y-3">
      {/* Cat Avatar */}
      <Skeleton className="w-20 h-20 rounded-full" />
      
      {/* Name */}
      <Skeleton className="h-5 w-24" />
      
      {/* Grade Badge */}
      <Skeleton className="h-6 w-16 rounded-full" />
      
      {/* Stats bars */}
      <div className="w-full space-y-2">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-4/5 rounded-full" />
        <Skeleton className="h-3 w-3/4 rounded-full" />
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-2 mt-2">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
    </div>
  );
}
