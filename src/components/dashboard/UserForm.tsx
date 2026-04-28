import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Loader2, X } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  initialData?: User;
  isEdit?: boolean;
}

export default function UserForm({ initialData, isEdit }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    if (isEdit) {
      (data as any).id = initialData?.id;
    }

    try {
      const url = isEdit ? '/api/admin/users/update' : '/api/admin/users/create';
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Gagal menyimpan data');
      }

      window.location.href = '/dashboard/admin/users';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
      <CardContent className="p-0">
        <div className="bg-slate-50 border-b border-slate-100 p-6">
           <h3 className="font-bold text-slate-800">
            {isEdit ? 'Profil Pegawai' : 'Tambah Pegawai'}
          </h3>
          <p className="text-xs text-slate-500">Kelola informasi dan hak akses sistem.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nama Lengkap</Label>
              <Input 
                id="name" 
                name="name" 
                defaultValue={initialData?.name} 
                placeholder="Nama pegawai" 
                className="rounded-lg border-slate-200 h-10 font-bold"
                required 
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                defaultValue={initialData?.email} 
                placeholder="nama@email.com" 
                className="rounded-lg border-slate-200 h-10 font-bold"
                required 
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                {isEdit ? 'Password Baru' : 'Password'}
              </Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder={isEdit ? '(Kosongkan jika tidak diubah)' : 'Min. 6 karakter'} 
                className="rounded-lg border-slate-200 h-10 font-bold"
                required={!isEdit} 
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Role/Jabatan</Label>
              <select 
                name="role" 
                defaultValue={initialData?.role || 'STAFF'}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-bold outline-none"
              >
                <option value="STAFF">Kasir (Staff)</option>
                <option value="MANAGER">Manager</option>
                {isEdit && initialData?.role === 'ADMIN' && <option value="ADMIN">Administrator</option>}
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-3">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 rounded-lg font-bold" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEdit ? 'Simpan Perubahan' : 'Tambah Pegawai'}
            </Button>
            <a href="/dashboard/admin/users" className="flex-1">
              <Button type="button" variant="outline" className="w-full h-11 rounded-lg border-slate-200 font-bold text-slate-400">Batal</Button>
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
