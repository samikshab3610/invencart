import { z } from 'zod';

// Schema for adding an item to the cart.
export const cartItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

// Schema for updating quantity of an existing cart item.
export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

// Schema for placing an order.
// We only need the shipping address from the client —
// everything else (price, stock, products) comes from the database.
export const placeOrderSchema = z.object({
  shippingAddress: z.string().min(10, 'Please provide a full shipping address'),
});

// Schema for owner manually restocking a product.
export const restockSchema = z.object({
  quantity: z.number().int().positive('Restock quantity must be at least 1'),
  reason: z.enum(['RESTOCK', 'MANUAL_ADJUSTMENT']).default('RESTOCK'),
});

// Schema for owner processing a return.
export const returnSchema = z.object({
  quantity: z.number().int().positive('Return quantity must be at least 1'),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type RestockInput = z.infer<typeof restockSchema>;
export type ReturnInput = z.infer<typeof returnSchema>;