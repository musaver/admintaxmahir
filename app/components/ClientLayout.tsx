'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AdminTopHeader } from '@/components/AdminTopHeader';
import { 
  MenuIcon,
  LayoutDashboardIcon,
  UsersIcon,
  PackageIcon,
  FolderIcon,
  FolderOpenIcon,
  PuzzleIcon,
  TagIcon,
  WrenchIcon,
  BarChart3Icon,
  ShoppingCartIcon,
  TruckIcon,
  TrendingUpIcon,
  UndoIcon,
  DollarSignIcon,
  PackageCheckIcon,
  ShieldIcon,
  LockIcon,
  FileTextIcon,
  SettingsIcon,
  LogOutIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BuildingIcon
} from 'lucide-react';

type NavigationItem = {
  name: string;
  href: string;
  icon: any;
  category: string;
  badge?: number | null;
  hasSubItems?: boolean;
  subItems?: Array<{
    name: string;
    href: string;
    icon: any;
  }>;
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Fetch pending orders count
  useEffect(() => {
    const fetchOrdersCount = async () => {
      try {
        const response = await fetch('/api/orders/count');
        if (response.ok) {
          const data = await response.json();
          setPendingOrdersCount(data.pendingCount);
        }
      } catch (error) {
        console.error('Error fetching orders count:', error);
      }
    };

    if (session) {
      fetchOrdersCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchOrdersCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Auto-expand navigation items with active sub-items
  useEffect(() => {
    if (!session) return; // Only run when session exists
    
    const productsSubItems = [
      { name: 'Inventory', href: '/inventory', icon: BarChart3Icon },
      { name: 'Categories', href: '/categories', icon: FolderIcon },
    ];
    
    const hasActiveSub = productsSubItems.some(subItem => {
      if (subItem.href === '/') {
        return pathname === '/' || pathname === '/dashboard';
      }
      return pathname.startsWith(subItem.href);
    });
    
    if (hasActiveSub && !expandedItems['Products']) {
      setExpandedItems(prev => ({ ...prev, 'Products': true }));
    }
  }, [pathname, expandedItems, session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!session) return <div>{children}</div>;

  const currentUser = session.user as any;
  const isSuperAdmin = currentUser?.type === 'super-admin';

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboardIcon, category: 'main' },
    ...(isSuperAdmin ? [{ name: 'Tenants', href: '/tenants', icon: BuildingIcon, category: 'main' }] : []),
    { name: 'Customers', href: '/users', icon: UsersIcon, category: 'main' },
    { 
      name: 'Products', 
      href: '/products', 
      icon: PackageIcon, 
      category: 'main',
      hasSubItems: true,
      subItems: [
        { name: 'Inventory', href: '/inventory', icon: BarChart3Icon },
        { name: 'Categories', href: '/categories', icon: FolderIcon },
      ]
    },
    /*{ name: 'Tags', href: '/tags', icon: TagIcon, category: 'main' },*/
    
    /*{ name: 'Suppliers', href: '/suppliers', icon: BuildingIcon, category: 'operations' },*/
    { name: 'Orders / Invoices', href: '/orders', icon: ShoppingCartIcon, category: 'operations', badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
    /*{ name: 'Purchase Orders', href: '/orders/purchase', icon: ShoppingCartIcon, category: 'operations' },*/
    /*{ name: 'Drivers', href: '/drivers', icon: TruckIcon, category: 'operations' },*/
    /*{ name: 'Reports', href: '/reports', icon: TrendingUpIcon, category: 'operations' },*/
    /*{ name: 'Returns', href: '/returns', icon: UndoIcon, category: 'operations' },*/
    /*{ name: 'Refunds', href: '/refunds', icon: DollarSignIcon, category: 'operations' },*/
    /*{ name: 'Shipping Labels', href: '/shipping-labels', icon: PackageCheckIcon, category: 'operations' },*/
    /*{ name: 'Subcategories', href: '/subcategories', icon: FolderOpenIcon, category: 'catalog' },*/
    /*{ name: 'Addons', href: '/addons', icon: PuzzleIcon, category: 'catalog' },*/
    /*{ name: 'Tasks', href: '/variation-attributes', icon: TagIcon, category: 'catalog' },*/
    /*{ name: 'Product Variants', href: '/product-variants', icon: WrenchIcon, category: 'catalog' },*/
    { name: 'Admin Users', href: '/admins', icon: ShieldIcon, category: 'admin' },
    { name: 'Admin Roles', href: '/roles', icon: LockIcon, category: 'admin' },
    /*{ name: 'Admin Logs', href: '/logs', icon: FileTextIcon, category: 'admin' },*/
    /*{ name: 'Settings', href: '/settings', icon: SettingsIcon, category: 'admin' },*/
    { name: 'Logout', href: '/logout', icon: LogOutIcon, category: 'admin' },
  ];

  const categories = {
    main: { name: 'Main', items: navigation.filter(item => item.category === 'main') },
    operations: { name: 'Operations', items: navigation.filter(item => item.category === 'operations') },
    /*catalog: { name: 'Catalog', items: navigation.filter(item => item.category === 'catalog') },*/
    admin: { name: 'Administration', items: navigation.filter(item => item.category === 'admin') },
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const isExpanded = (itemName: string) => {
    return expandedItems[itemName] || false;
  };

  const hasActiveSubItem = (subItems: NavigationItem['subItems']) => {
    return subItems?.some(subItem => isActive(subItem.href)) || false;
  };


  const NavItem = ({ item, mobile = false, collapsed = false }: { item: NavigationItem, mobile?: boolean, collapsed?: boolean }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    const hasSubItems = item.hasSubItems && item.subItems;
    const expanded = isExpanded(item.name);
    const hasActiveSub = hasSubItems ? hasActiveSubItem(item.subItems) : false;
    
    if (hasSubItems && !collapsed) {
      return (
        <Collapsible open={expanded}>
          <div
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-sidebar-accent w-full ${
              active || hasActiveSub ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'
            }`}
          >
            <Link
              href={item.href}
              className="flex items-center gap-3 flex-1 min-w-0"
              onClick={() => mobile && setSidebarOpen(false)}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </Link>
            <CollapsibleTrigger asChild>
              <button
                onClick={() => toggleExpanded(item.name)}
                className="ml-auto p-1 hover:bg-sidebar-accent-foreground/10 rounded"
              >
                {expanded ? (
                  <ChevronUpIcon className="h-4 w-4 text-sidebar-foreground/50" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-sidebar-foreground/50" />
                )}
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-1 mt-1 pl-3 border-l border-sidebar-border/50 ml-3">
            {item.subItems?.map((subItem) => (
              <Link
                key={subItem.name}
                href={subItem.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-sidebar-accent/70 ${
                  isActive(subItem.href) ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/70 hover:text-sidebar-accent-foreground'
                }`}
                onClick={() => mobile && setSidebarOpen(false)}
              >
                <subItem.icon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate text-xs">{subItem.name}</span>
              </Link>
            ))}
          </CollapsibleContent>
        </Collapsible>
      );
    }
    
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-sidebar-accent ${
          active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'
        }`}
        onClick={() => mobile && setSidebarOpen(false)}
        title={collapsed ? item.name : undefined}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                {item.badge > 99 ? '99+' : item.badge}
              </Badge>
            )}
          </>
        )}
        {collapsed && item.badge && (
          <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            {item.badge > 99 ? '99+' : item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full max-h-screen flex-col gap-2 fixed">
      {/* Header */}
      <div className={`flex h-14 items-center border-b pl-4 lg:h-[60px] lg:pl-6 ${sidebarCollapsed && !mobile ? 'justify-center' : ''}`}>
        <Link href="/" className={`flex items-center gap-2 font-semibold ${sidebarCollapsed && !mobile ? 'justify-center' : ''}`}>
          <LayoutDashboardIcon className="h-6 w-6 flex-shrink-0" />
          {(!sidebarCollapsed || mobile) && <span className="truncate">Admin Panel</span>}
        </Link>
        {mobile && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}

        {/* Collapse Toggle Button for Desktop */}
      {!mobile && (
        <div className="px-0 ml-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`w-full justify-center ${sidebarCollapsed ? '' : ''}`}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="h-4 " />
            ) : (
              <>
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>
      )}
      </div>

      

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {Object.entries(categories).map(([key, category]) => (
            <div key={key} className="mb-4">
              {(!sidebarCollapsed || mobile) && (
                <div className="mb-2 px-3 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
                  {category.name}
                </div>
              )}
              <div className="space-y-1">
                {category.items.map((item) => (
                  <div key={item.name} className="relative">
                    <NavItem item={item} mobile={mobile} collapsed={sidebarCollapsed && !mobile} />
                  </div>
                ))}
              </div>
              {key !== 'admin' && (!sidebarCollapsed || mobile) && <Separator className="my-4" />}
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <div className="mt-auto p-4">
        <div className={`flex items-center gap-3 rounded-lg bg-sidebar-accent p-3 ${sidebarCollapsed && !mobile ? 'justify-center' : ''}`}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
              {session?.user?.email?.charAt(0).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          {(!sidebarCollapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                {session?.user?.email || 'Admin User'}
              </p>
              <p className="text-xs text-sidebar-foreground/70">Administrator</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const sidebarWidth = sidebarCollapsed ? 'md:grid-cols-[80px_1fr] lg:grid-cols-[80px_1fr]' : 'md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]';

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Top Header */}
      <AdminTopHeader />
      
      <div className={`grid min-h-screen w-full max-w-full overflow-hidden pt-20 ${sidebarWidth}`}>
        {/* Desktop Sidebar */}
        <div className="hidden border-r bg-sidebar border-sidebar-border md:block overflow-y-auto">
          <SidebarContent />
        </div>

        <div className="flex flex-col min-w-0 overflow-hidden">
          {/* Mobile Header */}
          <header className="flex h-14 items-center gap-4 border-b bg-sidebar/40 border-sidebar-border px-4 lg:h-[60px] lg:px-6 md:hidden flex-shrink-0">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 relative">
                  <MenuIcon className="h-5 w-5" />
                  {pendingOrdersCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                    </Badge>
                  )}
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0">
                <SidebarContent mobile={true} />
              </SheetContent>
            </Sheet>
            <div className="w-full flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">Admin Panel</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto min-w-0 max-w-full bg-background">
            <div className="w-full max-w-full min-w-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 