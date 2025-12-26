
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Children, cloneElement } from 'react';
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
import { type Task, type User } from './todo/page';
import { format } from 'date-fns';


const navItems = [
  { href: '/chat', icon: MessagesSquare, label: 'Chat' },
  { href: '/notes', icon: NotebookText, label: 'Notes' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/todo', icon: ListChecks, label: 'To-Do' },
  { href: '/photos', icon: Image, label: 'Photos' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const initialTasks: Task[] = [
  { id: 1, text: 'Book that restaurant for Friday night', completedAt: null, createdBy: 'Her', createdAt: format(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy') },
  { id: 2, text: 'Pick up dry cleaning', completedAt: null, createdBy: 'Him', createdAt: format(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy') },
  { id: 3, text: 'Plan our next weekend trip', completedAt: '2024-07-24', createdBy: 'Her', createdAt: format(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy') },
  { id: 4, text: 'Get a gift for my mom\'s birthday', completedAt: null, createdBy: 'Him', createdAt: format(new Date(), 'dd/MM/yyyy') },
  { id: 5, text: 'muahh', completedAt: null, createdBy: 'Him', createdAt: format(new Date(), 'dd/MM/yyyy') },
];


export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const totalTasks = tasks.length;

  const handleAddTask = (newTaskText: string) => {
    if (!newTaskText.trim() || !user) return;

    const newTask: Task = {
      id: Date.now(),
      text: newTaskText.trim(),
      completedAt: null,
      createdBy: user,
      createdAt: format(new Date(), 'dd/MM/yyyy'),
    };

    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const handleToggleTask = (taskId: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completedAt: task.completedAt ? null : new Date().toISOString().split('T')[0],
        };
      }
      return task;
    }));
  };

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

  const childrenWithProps = Children.map(children, child => {
    if (React.isValidElement(child)) {
      return cloneElement(child, { 
          tasks, 
          setTasks, 
          handleAddTask, 
          handleToggleTask 
        } as any);
    }
    return child;
  });

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
                   {item.href === '/todo' && (
                    <Badge className="ml-auto group-data-[collapsible=icon]:hidden">{totalTasks}</Badge>
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
        {childrenWithProps}
      </SidebarInset>
    </SidebarProvider>
  );
}
