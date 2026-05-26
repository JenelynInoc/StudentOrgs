'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import api from '@/services/api';
import { Mail, KeyRound, Copy, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // State for after the token is generated
  const [tokenData, setTokenData] = useState<{ token: string; email: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', { email });

      if (response.data?.data) {
        setTokenData({
          token: response.data.data.token,
          email: response.data.data.email,
        });
        toast.success('Recovery token generated successfully!');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to process request';
      const fieldErrors = err.response?.data?.errors;

      if (fieldErrors?.email) {
        setError(fieldErrors.email[0]);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = () => {
    if (tokenData) {
      navigator.clipboard.writeText(tokenData.token);
      toast.success('Token copied to clipboard!');
    }
  };

  const proceedToReset = () => {
    if (tokenData) {
      router.push(`/reset-password?email=${encodeURIComponent(tokenData.email)}&token=${encodeURIComponent(tokenData.token)}`);
    }
  };

  // After token is successfully generated, show the token display
  if (tokenData) {
    return (
      <AuthLayout title="Recovery Token Generated" subtitle="Use this token to reset your password">
        <div className="space-y-5">
          {/* Success indicator */}
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-emerald-400" />
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center leading-relaxed">
            A password recovery token has been generated for <span className="font-bold text-white">{tokenData.email}</span>. 
            Copy the token below or proceed directly to reset your password.
          </p>

          {/* Token display box */}
          <div className="relative rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Security Token</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-violet-300 bg-slate-950/60 rounded-lg px-3 py-2.5 border border-slate-800 break-all select-all">
                {tokenData.token}
              </code>
              <button
                onClick={copyToken}
                className="shrink-0 h-9 w-9 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Copy token"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            onClick={proceedToReset}
          >
            <span className="flex items-center justify-center gap-2">
              Proceed to Reset Password
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>

          <div className="text-center">
            <Link href="/login" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              ← Back to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Default: Show the email input form
  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to receive a recovery token">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          name="email"
          label="Email Address"
          placeholder="your.email@school.edu"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          error={error}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full"
        >
          <span className="flex items-center justify-center gap-2">
            <Mail className="h-4 w-4" />
            Generate Recovery Token
          </span>
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
