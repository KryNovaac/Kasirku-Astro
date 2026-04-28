import React from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  loading?: boolean;
}

export default function DeleteConfirmDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title = "Apakah Anda yakin?", 
  description = "Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen.",
  loading = false
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-slate-200">
        <AlertDialogHeader className="space-y-3">
          <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
             <Trash2 className="w-6 h-6" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-slate-900 tracking-tight">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500 text-sm">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-2">
          <AlertDialogCancel disabled={loading} className="rounded-lg h-10 font-bold text-xs uppercase text-slate-400">Batal</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-10 px-6 font-bold text-xs uppercase shadow-none"
          >
            {loading ? "Menghapus..." : "Konfirmasi Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
