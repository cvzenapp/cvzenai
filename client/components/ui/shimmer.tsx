/**
 * Shimmer loading effect component
 */
export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
    </div>
  );
}

/**
 * Shimmer wrapper for content
 */
export function ShimmerWrapper({ 
  isLoading, 
  children,
  className = ""
}: { 
  isLoading: boolean; 
  children: React.ReactNode;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className="opacity-50">{children}</div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer-slide" />
      </div>
    );
  }
  
  return <>{children}</>;
}
