import React from 'react';
import { useAuth } from '../../lib/authContext';
import { Shield, Store, User as UserIcon, LogIn } from 'lucide-react';
import { Link } from '../../lib/navigation';

const ROLE_CONFIG = {
  CUSTOMER: {
    label: 'Customer',
    icon: UserIcon,
    bg: 'bg-[#b0f0d6]/30',
    text: 'text-[#003527]',
    border: 'border-[#95d3ba]/60',
    dot: 'bg-emerald-400',
  },
  SELLER: {
    label: 'Seller',
    icon: Store,
    bg: 'bg-amber-400/20',
    text: 'text-amber-200',
    border: 'border-amber-400/40',
    dot: 'bg-amber-400',
  },
  ADMIN: {
    label: 'Admin',
    icon: Shield,
    bg: 'bg-blue-400/20',
    text: 'text-blue-200',
    border: 'border-blue-400/40',
    dot: 'bg-blue-400',
  },
} as const;

export function RoleSwitcherBanner() {
  const { user, role } = useAuth();

  const config = role ? ROLE_CONFIG[role] : null;
  const RoleIcon = config?.icon;

  return (
    <div className="bg-[#064e3b] text-white text-xs px-3 py-1.5 border-b border-[#95d3ba]/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand label */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-[#95d3ba]/20 text-[#b0f0d6] px-2 py-0.5 rounded-full font-medium text-[11px] shrink-0">
            🇵🇰 HomeBiz PK
          </span>
        </div>

        {/* Right: User identity */}
        <div className="flex items-center gap-2 ml-auto">
          {user && config && RoleIcon ? (
            <>
              {/* Online dot */}
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />

              {/* User avatar tiny */}
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=003527&color=fff&size=40`
                }
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover border border-[#95d3ba]/50 shrink-0"
              />

              {/* Name */}
              <span className="hidden sm:inline text-emerald-100/90 text-[11px] truncate max-w-[140px]">
                <strong className="text-white font-semibold">{user.name}</strong>
              </span>

              {/* Role badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${config.bg} ${config.text} ${config.border}`}
              >
                <RoleIcon className="w-2.5 h-2.5" />
                {config.label}
              </span>
            </>
          ) : (
            /* Not logged in */
            <span className="inline-flex items-center gap-1.5 text-emerald-200/70 text-[11px]">
              <LogIn className="w-3 h-3" />
              <span className="hidden sm:inline">Not signed in —</span>
              <Link
                href="/auth/login"
                className="text-[#b0f0d6] hover:text-white font-semibold underline-offset-2 hover:underline transition-colors"
              >
                Sign In
              </Link>
              <span className="text-emerald-200/50">or</span>
              <Link
                href="/auth/register"
                className="text-[#b0f0d6] hover:text-white font-semibold underline-offset-2 hover:underline transition-colors"
              >
                Register
              </Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
