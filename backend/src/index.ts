import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes'; // import our auth routes
import helmet from 'helmet';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes'; 
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import wishlistRoutes from './routes/wishlistRoutes'; 
import reviewRoutes from './routes/reviewRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',   // your future frontend url
  credentials: true,
}));
app.use(helmet()); // sets secure HTTP headers — add this before everything else
// Any URL starting with /api/auth will be handled by authRoutes
// e.g. /api/auth/signup → matches router.post('/signup', ...)
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'InvenCart backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});