import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { login } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

// Validation schema — same pattern as backend but for the form
const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema), // connects Zod to React Hook Form
    });

    async function onSubmit(data: LoginFormData) {
        setIsLoading(true);
        setServerError('');

        try {
            const user = await login(data);
            setUser(user); // store user in Zustand

            // Redirect based on role — owner goes to admin, customer to shop
            if (user.role === 'OWNER') {
                navigate('/admin');
            } else {
                navigate('/shop');
            }
        } catch (error: any) {
            // Show the backend's error message (e.g. "Invalid email or password")
            setServerError(
                error.response?.data?.message || 'Something went wrong. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex">

                {/* Left side — branding */}
                <div className="hidden md:flex flex-col justify-center bg-indigo-600 p-10 w-1/2">
                    <h1 className="text-3xl font-semibold text-white mb-3">
                        Welcome to InvenCart
                    </h1>
                    <p className="text-indigo-200 text-sm leading-relaxed mb-8">
                        Your all-in-one platform for smart inventory and e-commerce management.
                    </p>
                    <div className="flex flex-col gap-4">
                        {[
                            'Secure payments via Razorpay',
                            'Real-time sales analytics',
                            'Automated inventory tracking',
                            'Full order lifecycle management',
                        ].map((feature) => (
                            <div key={feature} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-indigo-100 text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side — form */}
                <div className="flex flex-col justify-center p-10 w-full md:w-1/2">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">Sign in</h2>
                    <p className="text-sm text-gray-500 mb-8">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-600 hover:underline">
                            Create one
                        </Link>
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

                        {/* Email field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="you@example.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                {...register('password')}
                                type="password"
                                placeholder="Enter your password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                            />
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Server error message */}
                        {serverError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                                <p className="text-red-600 text-sm">{serverError}</p>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>

                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        Owner? Use your admin credentials to access the dashboard.
                    </p>
                </div>

            </div>
        </div>
    );
}