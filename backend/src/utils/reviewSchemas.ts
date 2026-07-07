import { z } from 'zod';

// Schema for creating a product review.
export const reviewSchema = z.object({
  // Rating must be a whole number between 1 and 5.
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),

  // Comment must have meaningful content — not just a space or two.
  comment: z.string().min(10, 'Review must be at least 10 characters'),
});

export type ReviewInput = z.infer<typeof reviewSchema>;