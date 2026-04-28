import React, { useState } from 'react';
import { UserPlus, Trash2, Edit2, Search, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { cn } from '@/lib/utils';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email?: string | null;
  role: string;
}

interface Props {
  initialUsers: User[];
}

export default function UserManagement({ initialUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/admin/users/delete?id=${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus pegawai');
      setUsers(users.filter(u => u.id !== deleteId));
      toast.success('Pegawai berhasil dihapus');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <DeleteConfirmDialog 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Hapus Akun Pegawai?"
        description="Data pegawai ini akan dihapus secara permanen. Mereka tidak akan bisa login lagi."
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Data Pegawai</h2>
          <p className="text-slate-500 text-sm">Kelola otoritas dan hak akses sistem.</p>
        </div>
        <a href="/dashboard/admin/users/add">
          <Button className="bg-blue-600 hover:bg-blue-700 h-10 px-5 rounded-lg font-bold gap-2">
            <UserPlus className="w-5 h-5" />
            Tambah Pegawai
          </Button>
        </a>
      </div>

      <div className="flex items-center gap-4 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Cari pegawai..." 
            className="pl-10 h-10 rounded-lg border-slate-200 font-bold"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-100 uppercase text-slate-500 text-[10px] font-bold">
              <th className="px-6 py-4 text-center">No</th>
              <th className="px-6 py-4 text-left">Username</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-center">Role</th>
              <th className="px-6 py-4 text-right px-8">Aksi</th>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {paginatedUsers.map((user, index) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 text-center text-slate-400 font-bold text-[10px]">
                  {String(startIndex + index + 1).padStart(2, '0')}
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{user.name || '-'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-500">
                  {user.email || '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                    user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                    user.role === 'MANAGER' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                    'bg-slate-100 text-slate-500 border-slate-200'
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right px-8">
                  <div className="flex justify-end gap-2 text-xs">
                    <a href={`/dashboard/admin/users/edit/${user.id}`}>
                      <Button variant="outline" size="sm" className="h-7 rounded-lg text-[10px] font-bold border-slate-200">
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    </a>
                    {user.role !== 'ADMIN' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50"
                        onClick={() => setDeleteId(user.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Hapus
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                  <p className="text-sm font-medium">Tidak ada data pegawai</p>
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-xs text-slate-500 font-medium">
            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} dari {filteredUsers.length} data
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 rounded-lg text-[10px] font-bold uppercase"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Prev
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={`w-8 h-8 rounded-lg text-[10px] font-bold ${currentPage === page ? 'bg-blue-600' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 rounded-lg text-[10px] font-bold uppercase"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
