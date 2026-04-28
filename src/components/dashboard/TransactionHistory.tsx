import React, { useState } from 'react';
import { Search, Download, Eye, ReceiptText, ShoppingCart, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { formatRupiah } from '@/lib/utils';

interface Transaction {
  id: string;
  total: number;
  createdAt: Date;
  cashier: { name: string, id?: string };
  isMember: boolean;
  memberPhone?: string | null;
  items: any;
}

interface Props {
  initialTransactions: Transaction[];
  userRole?: string;
}

export default function TransactionHistory({ initialTransactions, userRole }: Props) {
  const [transactions] = useState<Transaction[]>(initialTransactions);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter(tx => 
    tx.id.toLowerCase().includes(search.toLowerCase()) ||
    tx.cashier.name.toLowerCase().includes(search.toLowerCase()) ||
    (tx.cashier.id && tx.cashier.id.toLowerCase().includes(search.toLowerCase())) ||
    (tx.memberPhone && tx.memberPhone.includes(search))
  ).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const handleExport = () => {
    const headers = ['Tanggal', 'ID Transaksi', 'Kasir', 'Pelanggan', 'Total'];
    const rows = filteredTransactions.map(tx => [
      new Date(tx.createdAt).toLocaleString(),
      tx.id,
      tx.cashier.name,
      tx.isMember ? tx.memberPhone : 'Umum',
      tx.total
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transaksi_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari ID, Kasir atau HP..." 
              className="pl-10 h-11 rounded-xl border-slate-200 font-bold bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
          
          {userRole === 'STAFF' && (
            <Button 
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold gap-2 shadow-lg shadow-blue-100 uppercase text-[11px] tracking-wider"
              onClick={() => window.location.href = '/dashboard/pos'}
            >
              <ShoppingCart className="w-4 h-4" />
              Kasir Baru
            </Button>
          )}
        </div>
        <Button variant="outline" onClick={handleExport} className="h-11 px-6 rounded-xl font-bold gap-2 border-slate-200 text-slate-500 hover:bg-slate-50 uppercase text-[10px] tracking-widest">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4">Waktu</th>
              <th className="px-6 py-4">ID Ref</th>
              <th className="px-6 py-4">Kasir</th>
              <th className="px-6 py-4">Pelanggan</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4 text-right px-8">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 italic-none">
            {filteredTransactions.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-xs">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                  #{tx.id.slice(-8).toUpperCase()}
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-700">{tx.cashier?.name || 'Kasir'}</p>
                </td>
                <td className="px-6 py-4">
                  {tx.isMember ? (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase border border-blue-100">Member</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-400 rounded font-bold uppercase border border-slate-200">Umum</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">
                  {formatRupiah(tx.total)}
                </td>
                <td className="px-6 py-4 text-right px-8">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-50"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                   <p className="text-sm font-medium">Tidak ada riwayat transaksi</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Detail Struk</h3>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center border-b border-slate-100 pb-4">
                <h4 className="font-bold text-2xl text-slate-900">KasirKu</h4>
                <p className="text-xs text-slate-500 mt-1">{new Date(selectedTx.createdAt).toLocaleString('id-ID')}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">#{selectedTx.id}</p>
              </div>

              <div className="space-y-3">
                {Array.isArray(selectedTx.items) && selectedTx.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.name} x{item.quantity}</span>
                    <span className="font-semibold text-slate-900">{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between font-bold text-lg text-slate-900">
                  <span>TOTAL</span>
                  <span>{formatRupiah(selectedTx.total)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Kasir</span>
                  <span>{selectedTx.cashier.name}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Pelanggan</span>
                  <span>{selectedTx.isMember ? selectedTx.memberPhone : 'Umum'}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex gap-3 print:hidden">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl h-12 border-slate-200 text-slate-600 font-bold"
                onClick={() => {
                  window.print();
                }}
              >
                <ReceiptText className="w-4 h-4 mr-2" />
                Cetak Struk
              </Button>
              <Button className="flex-1 bg-slate-900 text-white rounded-xl h-12 font-bold" onClick={() => setSelectedTx(null)}>Selesai</Button>
            </div>
            
            {/* Global Print Styles for this component */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * { visibility: hidden; }
                .print-container, .print-container * { visibility: visible; }
                .print-container { 
                  position: absolute; 
                  left: 0; 
                  top: 0; 
                  width: 100%; 
                  padding: 20px;
                  background: white !important;
                }
                .no-print { display: none !important; }
              }
            `}} />
          </div>
          
          {/* Print specific container - hidden normally, only visible on print */}
          <div className="hidden print-container">
            <div className="text-center border-b border-slate-300 pb-4 mb-4">
              <h4 className="font-bold text-2xl text-black">KasirKu</h4>
              <p className="text-xs text-black mt-1">{new Date(selectedTx.createdAt).toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">#{selectedTx.id.toUpperCase()}</p>
            </div>

            <div className="space-y-2 mb-6">
              {Array.isArray(selectedTx.items) && selectedTx.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm text-black">
                  <span>{item.name} x{item.quantity}</span>
                  <span className="font-bold">{formatRupiah(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-dashed border-slate-300 space-y-2">
              <div className="flex justify-between font-bold text-lg text-black">
                <span>TOTAL</span>
                <span>{formatRupiah(selectedTx.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-black pt-4">
                <span>Kasir: {selectedTx.cashier.name}</span>
                <span>Customer: {selectedTx.isMember ? selectedTx.memberPhone : 'Umum'}</span>
              </div>
            </div>
            
            <div className="mt-8 text-center border-t border-slate-200 pt-4">
              <p className="text-[10px] font-bold uppercase text-black">Terima kasih atas kunjungan Anda</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
