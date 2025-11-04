import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden pl-64">
        <Header />
        
        <main className={cn('flex-1 overflow-y-auto bg-muted/20 p-6', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
