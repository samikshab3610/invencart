import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { productSchema } from '../utils/productSchemas';

// OWNER ONLY — create a new product.
export async function createProduct(req: Request, res: Response) {
  try {
    // Step 1: Validate input against our product schema.
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { name, description, price, stock, categoryId, imageUrl } = parsed.data;

    // Step 2: Confirm the categoryId actually exists in the database.
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Step 3: Create the product.
    // imageUrl: imageUrl ?? null converts undefined → null,
    // since Prisma expects string | null, not string | undefined.
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        imageUrl: imageUrl ?? null,
      },
      include: { category: true },
    });

    return res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// OWNER ONLY — update an existing product.
export async function updateProduct(req: Request, res: Response) {
  try {
    // Explicitly cast id to string — Express types req.params loosely.
    const id = req.params['id'] as string;

    // Allow partial updates — owner can update just price, or just stock, etc.
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    // Confirm the product actually exists before trying to update it.
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Build the update data explicitly to satisfy exactOptionalPropertyTypes.
    // Only include fields that were actually provided in the request.
    const updateData: {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
      categoryId?: string;
      imageUrl?: string | null;
    } = {};

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.price !== undefined) updateData.price = parsed.data.price;
    if (parsed.data.stock !== undefined) updateData.stock = parsed.data.stock;
    if (parsed.data.categoryId !== undefined) updateData.categoryId = parsed.data.categoryId;
    if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl ?? null;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return res.status(200).json({ message: 'Product updated', product });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// OWNER ONLY — delete a product.
export async function deleteProduct(req: Request, res: Response) {
  try {
    // Explicitly cast id to string.
    const id = req.params['id'] as string;

    // Confirm product exists before deleting.
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await prisma.product.delete({ where: { id } });

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// PUBLIC — get all products with search, filter, and pagination.
export async function getProducts(req: Request, res: Response) {
  try {
    // Read optional query parameters from the URL.
    // e.g. /api/products?search=phone&categoryId=xxx&page=2&limit=10
    const { search, categoryId, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // How many records to skip — used for pagination.
    const skip = (pageNum - 1) * limitNum;

    // Build the filter dynamically — only add conditions actually provided.
    const where: {
      OR?: Array<{ name?: object; description?: object }>;
      categoryId?: string;
    } = {};

    if (search) {
      // Case-insensitive search across name and description.
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    // Run both queries in parallel for efficiency.
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return res.status(200).json({
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// PUBLIC — get a single product by ID.
export async function getProductById(req: Request, res: Response) {
  try {
    // Explicitly cast id to string.
    const id = req.params['id'] as string;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}