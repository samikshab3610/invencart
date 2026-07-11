// These types match exactly what your backend returns
// so TypeScript catches mismatches between frontend and backend

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'OWNER';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string; // Prisma returns Decimal as string
  stock: number;
  imageUrl: string | null;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: string;
  product?: Product;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: string;
  stripePaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string };
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: Product;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: Pagination;
}

export interface CartResponse {
  cartItems: CartItem[];
  total: number;
}

export interface SalesSummary {
  period: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: number;
  totalItemsSold: number;
  averageOrderValue: number;
}