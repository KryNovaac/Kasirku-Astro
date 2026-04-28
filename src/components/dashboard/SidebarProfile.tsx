import React, { useState } from 'react';
import { Settings, LogOut, Users, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import SettingsContent from './SettingsContent';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '../../lib/utils';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function SidebarProfile({ user }: { user: UserData }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="mt-auto">
        <div className="h-[1px] w-full bg-slate-100 mb-6 mx-auto w-[85%]" />

        <div className="flex items-center justify-between px-4 pb-6 group transition-all duration-200">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9 shrink-0 cursor-pointer border border-slate-100">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
              <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col truncate max-w-[120px]">
              <span className="text-sm font-bold text-slate-900 truncate">
                {user.name}
              </span>
              <span className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tight">
                {user.role}
              </span>
            </div>
          </div>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            title="Pengaturan"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <Modal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        title="Pengaturan Akun"
      >
        <SettingsContent user={user} />
      </Modal>
    </>
  );
}
