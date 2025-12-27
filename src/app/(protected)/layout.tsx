
'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  useSidebar,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  MessagesSquare,
  NotebookText,
  CalendarDays,
  ListChecks,
  Image,
  ShieldCheck,
  LogOut,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotesProvider, useNotes } from '@/context/notes-context';
import { TasksProvider, useTasks } from '@/context/todo-context';
import { format } from 'date-fns';


const navItems = [
  { href: '/chat', icon: MessagesSquare, label: 'Chat' },
  { href: '/notes', icon: NotebookText, label: 'Notes' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/todo', icon: ListChecks, label: 'To-Do' },
  { href: '/photos', icon: Image, label: 'Photos' },
  { href: '/discipline', icon: ShieldCheck, label: 'Discipline' },
];

function NavMenuItems() {
  const { user } = useAuth();
  const { notes } = useNotes();
  const { tasks } = useTasks();
  const pathname = usePathname();

  const otherUser = user === 'Raveen' ? 'Priya' : 'Raveen';
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const otherUserHasNoteToday = notes.some(
    (note) =>
      note.date === todayKey && note.author === otherUser && note.text.trim() !== ''
  );
  
  const uncheckedTodoCount = tasks.filter(task => !task.completedAt).length;

  return (
    <>
      {navItems.map((item) => {
        const showNoteNotification =
          item.href === '/notes' && otherUserHasNoteToday;
        const showTodoBadge = item.href === '/todo' && uncheckedTodoCount > 0;
        
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              as={Link}
              href={item.href}
              isActive={pathname.startsWith(item.href)}
              tooltip={{ children: item.label }}
            >
              <item.icon />
              <span>{item.label}</span>
              {showNoteNotification && (
                <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              )}
               {showTodoBadge && (
                <SidebarMenuBadge>{uncheckedTodoCount}</SidebarMenuBadge>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}


function AppWithSidebar({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar();
  
  return (
    <div className="flex h-full">
      <Sidebar>
        <SidebarContent>
          <SidebarHeader>
            <Logo className="text-3xl" />
          </SidebarHeader>
          <SidebarMenu className="flex-1">
            <NavMenuItems />
          </SidebarMenu>
          <SidebarFooter className="items-center">
            <div className="flex w-full items-center justify-between p-2">
              <div className="flex items-center gap-2">
                {user && (
                  <>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        {user.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">
                      {user}
                    </span>
                  </>
                )}
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
        {isMobile && (
           <div className="p-2 md:hidden flex items-center">
            <Button
              variant="ghost"
              className="p-0 h-auto hover:bg-transparent"
              onClick={toggleSidebar}
            >
              <Logo className="text-3xl" />
            </Button>
          </div>
        )}
        {children}
      </SidebarInset>
    </div>
  );
}

function MainAppLayout({ children }: { children: React.ReactNode }) {
  return (
      <SidebarProvider>
        <NotesProvider>
          <TasksProvider>
            <AppWithSidebar>
              {children}
            </AppWithSidebar>
          </TasksProvider>
        </NotesProvider>
      </SidebarProvider>
  );
}


export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  React.useEffect(() => {
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

  return <MainAppLayout>{children}</MainAppLayout>;
}

