import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { categorySchema } from '../utils/productSchemas';

// OWNER ONLY — create a new category.
export async function createCategory(req: Request, res: Response) {
  try {
    // Step 1: Validate input
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { name } = parsed.data;

    // Step 2: Generate a URL-friendly slug from the name.
    // e.g. "Home & Kitchen" -> "home-kitchen"
    // Slugs are useful later for clean URLs like /category/home-kitchen
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // replace anything that's not a letter/number with a dash
      .replace(/(^-|-$)/g, '');    // remove leading/trailing dashes

    // Step 3: Create the category. The @unique constraints on name/slug
    // in our schema will throw an error automatically if duplicated.
    const category = await prisma.category.create({
      data: { name, slug },
    });

    return res.status(201).json({ message: 'Category created', category });
  } catch (error: any) {
    // Prisma's specific error code for "unique constraint violated"
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Category already exists' });
    }
    console.error('Create category error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// PUBLIC — anyone (customer or not logged in) can view all categories,
// since they need this to browse products by category.
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}