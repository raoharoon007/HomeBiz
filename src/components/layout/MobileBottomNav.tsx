import React from 'react';
import { Link, usePathname } from '../../lib/navigation';
import { useAuth } from '../../lib/authContext';
import { Storage, useStorageSubscription } from '../../lib/storage';
import { Home, Compass, PlusCircle, MessageSquare, LayoutDashboard } from 'lucide-react';

export function MobileBottomNav() {
  useStorageSubscription();
  const pathname = usePathname();
  const { role, user } = useAuth();

  const userVendor = user
    ? Storage.getVendors().find((v) => v.id === user.sellerProfileId || v.userId === user.id)
    : null;

  const conversations = Storage.getConversations();
  const unreadMessagesCount = user
    ? conversations.reduce((acc, c) => {
      if (
        role === 'SELLER' &&
        (c.vendorId === user.sellerProfileId ||
          c.vendorId === user.id ||
          (userVendor && c.vendorId === userVendor.id) ||
          c.participants?.some((p) => p.id === user.id || (userVendor && p.id === userVendor.id)))
      ) {
        return acc + (c.unreadCountVendor || 0);
      }
      if (c.customerId === user.id || c.participants?.some((p) => p.id === user.id)) {
        return acc + (c.unreadCountCustomer || 0);
      }
      return acc;
    }, 0)
    : 0;

  const getDashboardLink = () => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'SELLER') return '/seller/dashboard';
    return '/customer/dashboard';
  };

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Request', href: '/request', icon: PlusCircle, isSpecial: true },
    {
      label: 'Messages',
      href: role === 'SELLER' ? '/seller/dashboard/messages' : '/customer/dashboard/messages',
      icon: MessageSquare,
      badge: unreadMessagesCount,
    },
    { label: 'Dashboard', href: getDashboardLink(), icon: LayoutDashboard },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#e3e2e1] px-2 py-1.5 shadow-lg min-[821px]:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-[#003527] text-white flex items-center justify-center shadow-lg border-2 border-white">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-[#003527] mt-1">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${isActive ? 'text-[#003527] font-bold' : 'text-[#665d55] font-medium'
                }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#ba1a1a] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
