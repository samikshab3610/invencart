import api from './axiosInstance';

export async function addToWishlist(productId: string) {
  const response = await api.post(`/api/wishlist/${productId}`);
  return response.data;
}

export async function getWishlist() {
  const response = await api.get('/api/wishlist');
  return response.data;
}

export async function removeFromWishlist(productId: string) {
  const response = await api.delete(`/api/wishlist/${productId}`);
  return response.data;
}