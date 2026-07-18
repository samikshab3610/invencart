import api from './axiosInstance';

export async function placeOrder(data: { shippingAddress: string }) {
  const response = await api.post('/api/orders', data);
  return response.data;
}

export async function getMyOrders() {
  const response = await api.get('/api/orders/my-orders');
  return response.data;
}

export async function getOrderById(id: string) {
  const response = await api.get(`/api/orders/my-orders/${id}`);
  return response.data;
}

export async function cancelOrder(orderId: string) {
  const response = await api.post(`/api/inventory/cancel/${orderId}`);
  return response.data;
}