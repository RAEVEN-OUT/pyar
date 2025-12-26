
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  MessagesSquare,
  NotebookText,
  CalendarDays,
  ListChecks,
  Image,
  Settings,
  LogOut,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { type Task } from './todo/page';


const navItems = [
  { href: '/chat', icon: MessagesSquare, label: 'Chat' },
  { href: '/notes', icon: NotebookText, label: 'Notes' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/todo', icon: ListChecks, label: 'To-Do' },
  { href: '/photos', icon: Image, label: 'Photos' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

// Mock data for todo count - in a real app this would come from a data store
const initialTasks: Task[] = [
  { id: 1, text: 'Book that restaurant for Friday night', completed: false, createdBy: 'Her' },
  { id: 2, text: 'Pick up dry cleaning', completed: false, createdBy: 'Him' },
  { id: 3, text: 'Plan our next weekend trip', completed: true, createdBy: 'Her' },
  { id: 4, text: 'Get a gift for my mom\'s birthday', completed: false, createdBy: 'Him' },
];


export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // In a real app, you'd fetch this from a shared state/context.
  // For now, we are just mocking it to demonstrate the badge.
  const [tasks, setTasks] = useState(initialTasks);
  const incompleteTasks = tasks.filter(t => !t.completed).length;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Heart className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarHeader>
            <Logo className="text-3xl" />
          </SidebarHeader>
          <SidebarMenu className="flex-1">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  as={Link}
                  href={item.href}
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.label }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                   {item.href === '/todo' && incompleteTasks > 0 && (
                    <Badge className="ml-auto group-data-[collapsible=icon]:hidden">{incompleteTasks}</Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarFooter className="items-center">
            <div className="flex w-full items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent text-accent-foreground">
                    {user.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">
                  {user}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="group-data-[collapsible=icon]:w-full"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="absolute left-4 top-4">
          <SidebarTrigger />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
