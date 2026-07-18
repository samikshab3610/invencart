import api from './axiosInstance';

export async function addToCart(data: {
  productId: string;
  quantity: number;
}) {
  const response = await api.post('/api/cart', data);
  return response.data;
}

export async function getCart() {
  const response = await api.get('/api/cart');
  return response.data;
}

export async function updateCartItem(id: string, quantity: number) {
  const response = await api.put(`/api/cart/${id}`, { quantity });
  return response.data;
}

export async function removeFromCart(id: string) {
  const response = await api.delete(`/api/cart/${id}`);
  return response.data;
}

export async function clearCart() {
  const response = await api.delete('/api/cart/clear');
  return response.data;
}