import { z } from 'zod';

// Rules for creating/editing a product.
// Owner-only — but we still validate strictly, since trusting
// "this request came from an authenticated owner" is not the same
// as trusting the actual data they typed in.
export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be greater than 0'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  categoryId: z.string().uuid('Invalid category ID'),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

// Rules for creating a category — kept simple on purpose.
export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
});

export type CategoryInput = z.infer<typeof categorySchema>;