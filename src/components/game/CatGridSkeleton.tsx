import { CatCardSkeleton } from './CatCardSkeleton';

interface CatGridSkeletonProps {
  count?: number;
  compact?: boolean;
}

export function CatGridSkeleton({ count = 6, compact = false }: CatGridSkeletonProps) {
  return (
    <div className="cat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="animate-fade-in-up"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <CatCardSkeleton compact={compact} />
        </div>
      ))}
    </div>
  );
}
