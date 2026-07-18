// Skeleton loader — shown while products are fetching from the API.
// Matches the exact shape of a ProductCard so the layout doesn't jump
// when real data arrives. This is called a "content placeholder" pattern.
export default function ProductSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="h-48 bg-gray-100" />

      {/* Content placeholders */}
      <div className="p-4">
        <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-3/4 mb-1" />
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
        <div className="h-6 bg-gray-100 rounded w-1/3 mb-4" />
        <div className="flex justify-between">
          <div className="h-5 bg-gray-100 rounded w-16" />
          <div className="h-7 bg-gray-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

// Renders a grid of skeletons — pass count to control how many show
export function ProductSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}