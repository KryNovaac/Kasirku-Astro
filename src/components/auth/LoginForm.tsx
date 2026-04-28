import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Login gagal');
      }

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto dark:bg-slate-900 dark:border-slate-800 dark:shadow-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] border-slate-100 overflow-hidden">
      <CardHeader className="space-y-2 p-10 pb-6">
        <CardTitle className="text-3xl font-bold text-center text-slate-900 dark:text-white">
          Kasir<span className="animate-moving-gradient">Ku</span>
        </CardTitle>
        <CardDescription className="text-center text-sm text-slate-500">
          Akses Portal Operasional Toko
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 px-10">
          {error && (
            <div className="p-4 text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-2xl animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1" htmlFor="email">Email</label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="admin@toko.com" 
              required 
              className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:ring-indigo-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1" htmlFor="password">Password</label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:ring-indigo-600"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-10 pt-6">
          <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95 font-bold" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Masuk
          </Button>
          <a href="/" className="w-full">
            <Button type="button" variant="outline" className="w-full h-14 rounded-2xl border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-medium">
              Kembali Ke Beranda
            </Button>
          </a>
          <p className="text-sm text-center text-slate-500 mt-2">
            Belum punya akun?{' '}
            <a href="/auth/register" className="text-indigo-600 font-semibold hover:underline">Registrasi</a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
