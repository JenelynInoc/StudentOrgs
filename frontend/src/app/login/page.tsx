'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useMemberAuthStore } from '@/store/memberAuthStore';
import api from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useMemberAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await api.post('/auth/login', formData);

      if (response.data.data) {
        const { user, token } = response.data.data;
        setUser(user, token);
        toast.success('Login successful');
        router.push('/dashboard');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      const errorDetails = error.response?.data?.errors;

      if (errorDetails) {
        setErrors(errorDetails);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Student Login" subtitle="Sign in to your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          name="email"
          label="Email"
          placeholder="your.email@school.edu"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email?.[0]}
          required
        />

        <Input
          type="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password?.[0]}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-xs">
        <p className="text-slate-400">
          Don't have an account?{' '}
          <Link href="/register" className="font-bold text-violet-400 hover:text-violet-350 transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
