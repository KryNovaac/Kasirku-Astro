import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Tag, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../ui/dialog";
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

export default function CategoryManagement({ userRole }: { userRole: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      toast.error('Gagal mengambil data kategori');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return toast.error('Nama kategori wajib diisi');

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });

      if (res.ok) {
        toast.success('Kategori berhasil ditambahkan');
        setNewName('');
        setIsAdding(false);
        fetchCategories();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Gagal menambahkan kategori');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini? Produk dengan kategori ini akan menjadi tidak memiliki kategori.')) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Kategori berhasil dihapus');
        fetchCategories();
      } else {
        toast.error('Gagal menghapus kategori');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Kategori</h1>
          <p className="text-slate-500 text-sm">Atur kategori produk untuk pengelompokan yang lebih baik.</p>
        </div>
        
        {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-lg h-10 px-6 font-bold gap-2">
                <Plus className="w-5 h-5" />
                Tambah Kategori
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-slate-50 border-b border-slate-100 p-6">
                <DialogHeader>
                  <DialogTitle className="font-bold text-slate-800">Kategori Baru</DialogTitle>
                </DialogHeader>
                <p className="text-xs text-slate-500 mt-1">Gunakan kategori untuk mengelompokkan produk Anda.</p>
              </div>
              <form onSubmit={handleAdd} className="p-6 space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nama Kategori</Label>
                  <Input 
                    placeholder="Makanan, Minuman, dsb." 
                    className="h-10 rounded-lg border-slate-200 font-bold"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 h-11 bg-blue-600 rounded-lg font-bold">
                    Simpan Kategori
                  </Button>
                  <Button type="button" variant="outline" className="flex-1 h-11 rounded-lg font-bold text-slate-400" onClick={() => setIsAdding(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari kategori..." 
              className="pl-10 h-10 bg-white border-slate-200 rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent border-slate-100 uppercase text-[10px] text-slate-500 font-bold">
                <th className="px-6 py-4 text-left">Nama Kategori</th>
                <th className="px-6 py-4 text-center">Kode REF</th>
                <th className="px-6 py-4 text-right px-8">Aksi</th>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filtered.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <Tag className="w-4 h-4" />
                      </div>
                      <p className="font-bold text-slate-800 text-sm">{cat.name || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      #{cat.id.slice(-8).toUpperCase()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right px-8">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-rose-600 hover:bg-rose-50 rounded-lg h-8 text-[10px] font-bold"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center text-slate-400">
                    <p className="text-sm font-medium">Tidak ada data kategori</p>
                  </td>
                </tr>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
