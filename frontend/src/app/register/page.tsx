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

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useMemberAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    student_id: '',
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
      const response = await api.post('/auth/register', formData);

      if (response.data.data) {
        const { user, token } = response.data.data;
        setUser(user, token);
        toast.success('Registration successful');
        router.push('/dashboard');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
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
    <AuthLayout title="Create Account" subtitle="Join the student community">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          name="name"
          label="Full Name"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name?.[0]}
          required
        />

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
          type="text"
          name="student_id"
          label="Student ID (Optional)"
          placeholder="STU-2026-001"
          value={formData.student_id}
          onChange={handleInputChange}
          error={errors.student_id?.[0]}
        />

        <Input
          type="password"
          name="password"
          label="Password"
          placeholder="Minimum 8 characters"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password?.[0]}
          required
        />

        <Input
          type="password"
          name="password_confirmation"
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={formData.password_confirmation}
          onChange={handleInputChange}
          error={errors.password_confirmation?.[0]}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full"
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-xs">
        <p className="text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-violet-400 hover:text-violet-350 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
