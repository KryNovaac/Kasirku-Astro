import React, { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export function RefreshButton({ className }: { className?: string }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Dispatch event for React islands
    window.dispatchEvent(new Event('refresh-data'));
    
    // If not a pure SPA, reload the page after a short delay to ensure DB sync
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleRefresh}
      className={cn(
        "h-9 w-9 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-all border border-transparent hover:border-slate-200",
        className
      )}
      disabled={isRefreshing}
    >
      <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
    </Button>
  );
}
