import { Link } from 'react-router-dom';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
}: ProductCardProps) {
  // Format price — backend returns Decimal as string e.g. "79999"
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(product.price));

  // Stock status label and color
  const stockStatus =
    product.stock === 0
      ? { label: 'Out of stock', color: 'bg-red-100 text-red-700' }
      : product.stock <= 10
      ? { label: 'Low stock', color: 'bg-yellow-100 text-yellow-700' }
      : { label: 'In stock', color: 'bg-green-100 text-green-700' };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">

      {/* Product image */}
      <Link to={`/shop/${product.id}`}>
        <div className="h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            // Placeholder when no image is uploaded
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
      </Link>

      {/* Product info */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs font-medium text-indigo-600 mb-1">
          {product.category.name}
        </p>

        {/* Name — link to detail page */}
        <Link to={`/shop/${product.id}`}>
          <h3 className="text-sm font-medium text-gray-900 mb-1 hover:text-indigo-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <p className="text-lg font-semibold text-gray-900 mb-3">
          {formattedPrice}
        </p>

        {/* Stock badge + action buttons */}
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${stockStatus.color}`}>
            {stockStatus.label}
          </span>

          <div className="flex items-center gap-2">
            {/* Wishlist button */}
            <button
              onClick={() => onAddToWishlist(product)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Add to wishlist"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            {/* Add to cart button */}
            <button
              onClick={() => onAddToCart(product)}
              disabled={product.stock === 0}
              className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}