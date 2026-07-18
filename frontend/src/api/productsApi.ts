import api from './axiosInstance';
import type { Product, ProductsResponse, Category } from '../types';

// Fetch all products with optional search, category filter, and pagination.
// Called on the shop page — parameters come from URL query strings.
export async function getProducts(params?: {
  search?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> {
  const response = await api.get('/api/products', { params });
  return response.data;
}

// Fetch a single product by ID — called on the product detail page.
export async function getProductById(id: string): Promise<Product> {
  const response = await api.get(`/api/products/${id}`);
  return response.data.product;
}

// Fetch all categories — used for the category filter sidebar.
export async function getCategories(): Promise<Category[]> {
  const response = await api.get('/api/categories');
  return response.data.categories;
}