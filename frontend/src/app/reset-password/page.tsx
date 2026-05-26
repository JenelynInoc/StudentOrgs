'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import api from '@/services/api';
import { ShieldCheck } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Pre-populate token and email from the URL query params
  useEffect(() => {
    const paramEmail = searchParams.get('email');
    const paramToken = searchParams.get('token');
    if (paramEmail) setEmail(paramEmail);
    if (paramToken) setToken(paramToken);
  }, [searchParams]);

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

    // Client-side password match check
    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      if (response.data) {
        setSuccess(true);
        toast.success('Password reset successful!');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to reset password';
      const fieldErrors = err.response?.data?.errors;

      if (fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const key in fieldErrors) {
          mapped[key] = Array.isArray(fieldErrors[key]) ? fieldErrors[key][0] : fieldErrors[key];
        }
        setErrors(mapped);
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success state: show confirmation and redirect CTA
  if (success) {
    return (
      <AuthLayout title="Password Reset Complete" subtitle="Your password has been changed successfully">
        <div className="space-y-5">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center animate-pulse">
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Your password for <span className="font-bold text-white">{email}</span> has been updated. 
            You can now sign in with your new credentials.
          </p>

          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Default: Show the reset form
  return (
    <AuthLayout title="Reset Password" subtitle="Enter your new password below">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Token field (read-only, pre-filled) */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Recovery Token</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your recovery token"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 px-4 text-xs font-mono text-violet-300 outline-none focus:border-violet-500 transition-all placeholder:text-slate-600"
            required
          />
          {errors.token && <p className="mt-1 text-xs text-red-400">{errors.token}</p>}
        </div>

        {/* Email field (read-only, pre-filled) */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@school.edu"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 px-4 text-xs text-slate-200 outline-none focus:border-violet-500 transition-all placeholder:text-slate-600"
            required
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>

        <Input
          type="password"
          name="password"
          label="New Password"
          placeholder="Minimum 8 characters"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          required
        />

        <Input
          type="password"
          name="password_confirmation"
          label="Confirm New Password"
          placeholder="Re-enter your new password"
          value={formData.password_confirmation}
          onChange={handleInputChange}
          error={errors.password_confirmation}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full"
        >
          Reset Password
        </Button>
      </form>

      <div className="mt-6 text-center text-xs">
        <p className="text-slate-400">
          Remember your password?{' '}
          <Link href="/login" className="font-bold text-violet-400 hover:text-violet-300 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

// Next.js requires Suspense around useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="Reset Password" subtitle="Loading...">
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
      </AuthLayout>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
