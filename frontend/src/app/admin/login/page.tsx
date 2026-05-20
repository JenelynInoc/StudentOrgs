'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import api from '@/services/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAdmin } = useAdminAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await api.post('/admin/login', formData);

      if (response.data.data) {
        const { admin, token } = response.data.data;
        setAdmin(admin, token);
        toast.success('Login successful');
        router.push('/admin/dashboard');
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
    <AuthLayout
      title="Admin Login"
      subtitle="Sign in to your administrator account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          name="email"
          label="Email"
          placeholder="admin@soms.local"
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
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500">
          This page is not publicly listed. Only authorized personnel may access this portal.
        </p>
      </div>
    </AuthLayout>
  );
}
