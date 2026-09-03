import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Storage } from './storage';
import { supabase, isSupabaseConfigured } from './supabase';

const RANDOM_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
];

function getRandomAvatar(): string {
  return RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)];
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoggedIn: boolean;
  switchRole: (role: UserRole) => void;
  login: (email: string, password: string) => Promise<boolean>;
  loginAs: (user: User) => void;
  register: (name: string, email: string, password: string, role: UserRole, city: string, businessName?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => Storage.getActiveUser());

  // Listen to Supabase Auth State changes and sync with local active session
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Check active Supabase session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncProfileFromSupabase(session.user.id, session.user.email || '');
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await syncProfileFromSupabase(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        Storage.setActiveUserId(null);
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Listen to cross-component storage updates
  useEffect(() => {
    const handleStorage = () => {
      setUser(Storage.getActiveUser());
    };
    window.addEventListener('hb_storage_update', handleStorage);
    return () => window.removeEventListener('hb_storage_update', handleStorage);
  }, []);

  const syncProfileFromSupabase = async (userId: string, email: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        const syncedUser: User = {
          id: profile.id,
          name: profile.name || splitEmail(email),
          email: profile.email || email,
          phone: profile.phone || '',
          role: profile.role || 'CUSTOMER',
          avatar: profile.avatar || getRandomAvatar(),
          city: profile.city || 'Lahore',
          address: profile.address || '',
          sellerProfileId: profile.seller_profile_id,
          createdAt: profile.created_at || new Date().toISOString(),
        };
        Storage.saveUser(syncedUser);
        Storage.setActiveUserId(syncedUser.id);
        setUser(syncedUser);
      }
    } catch (e) {
      console.warn('Profile sync error:', e);
    }
  };

  const splitEmail = (em: string) => em.split('@')[0] || 'User';

  const switchRole = (newRole: UserRole) => {
    const allUsers = Storage.getUsers();
    let targetUser = allUsers.find((u) => u.role === newRole);

    if (!targetUser) {
      if (newRole === 'ADMIN') {
        targetUser = allUsers.find((u) => u.id === 'user-admin');
      } else if (newRole === 'SELLER') {
        targetUser = allUsers.find((u) => u.id === 'user-v1');
      } else {
        targetUser = allUsers.find((u) => u.id === 'user-c1');
      }
    }

    if (targetUser) {
      Storage.setActiveUserId(targetUser.id);
      setUser(targetUser);
    }
  };

  const loginAs = (customUser: User) => {
    Storage.saveUser(customUser);
    Storage.setActiveUserId(customUser.id);
    setUser(customUser);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try Supabase Auth First
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (!error && data.user) {
          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          const activeUser: User = {
            id: data.user.id,
            name: profile?.name || data.user.user_metadata?.name || splitEmail(normalizedEmail),
            email: normalizedEmail,
            role: (profile?.role || data.user.user_metadata?.role || 'CUSTOMER') as UserRole,
            avatar: profile?.avatar || data.user.user_metadata?.avatar || getRandomAvatar(),
            city: profile?.city || data.user.user_metadata?.city || 'Lahore',
            createdAt: profile?.created_at || new Date().toISOString(),
            sellerProfileId: profile?.seller_profile_id,
          };

          Storage.saveUser(activeUser);
          Storage.setActiveUserId(activeUser.id);
          setUser(activeUser);
          return true;
        }
      } catch (err) {
        console.warn('Supabase signin attempt:', err);
      }
    }

    // 2. Fallback to LocalStorage (Demo personas & offline accounts)
    const existing = Storage.authenticateUser(normalizedEmail, password);
    if (existing) {
      Storage.setActiveUserId(existing.id);
      setUser(existing);
      return true;
    }

    return false;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    city: string,
    businessName?: string
  ): Promise<User> => {
    const normalizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    if (!normalizedEmail || !sanitizedPassword || sanitizedPassword.length < 6) {
      throw new Error('A valid email and a password of at least 6 characters are required.');
    }

    let createdId = `user-${Date.now()}`;
    const avatar = getRandomAvatar();

    // 1. Register with Supabase Auth if configured
    if (isSupabaseConfigured) {
      const siteRedirectUrl = typeof window !== 'undefined' && window.location.origin
        ? `${window.location.origin}/`
        : (import.meta.env.VITE_APP_URL || 'https://home-biz-jade.vercel.app/');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: sanitizedPassword,
        options: {
          emailRedirectTo: siteRedirectUrl,
          data: {
            name: name.trim(),
            role,
            city,
            avatar,
            businessName: businessName?.trim() || `${name.trim()}'s Kitchen`,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (authData.user) {
        createdId = authData.user.id;
      }
    }

    const newUser: User = {
      id: createdId,
      name: name.trim(),
      email: normalizedEmail,
      password: sanitizedPassword,
      role,
      city,
      avatar,
      createdAt: new Date().toISOString(),
    };

    // If registering as a SELLER, create vendor profile
    if (role === 'SELLER' && businessName) {
      const vendorId = `vendor-${Date.now()}`;
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      newUser.sellerProfileId = vendorId;

      const vendorData = {
        userId: newUser.id,
        businessName,
        slug,
        tagline: `${businessName} - Quality home business in ${city}`,
        description: `Welcome to ${businessName}. We take pride in delivering top-quality bespoke services tailored to your needs.`,
        category: 'cakes-baking',
        subcategories: ['Custom Fondant Cakes', 'Bento & Korean Cakes'],
        city,
        locality: `${city} Central`,
        showExactAddress: false,
        coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
        avatar: newUser.avatar,
        gallery: [
          'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
        ],
        startingPrice: 1500,
        rating: 5.0,
        reviewCount: 1,
        responseTime: '< 30 mins',
        experienceYears: 2,
        status: 'APPROVED' as const,
        verificationStatus: 'VERIFIED' as const,
        isFeatured: false,
        serviceAreas: [city],
        specialties: ['Custom Made', 'Pure Ingredients', 'Doorstep Delivery'],
        services: [
          {
            id: `srv-${Date.now()}`,
            title: 'Standard Bespoke Package',
            description: 'Handcrafted with premium ingredients and attention to detail.',
            price: 2500,
            duration: '24-48 hours prep',
            noticePeriod: 'Requires 2 days notice',
            image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
            category: 'cakes-baking',
            addons: [],
          },
        ],
        availabilityNotice: 'Accepting bookings for this week.',
        coordinates: { lat: 31.5204, lng: 74.3587 },
        createdAt: new Date().toISOString(),
      };

      Storage.saveVendor({ id: vendorId, ...vendorData });

      // If Supabase is connected and we have a real UUID, write to Supabase vendors table
      if (isSupabaseConfigured && !newUser.id.startsWith('user-')) {
        try {
          const { error: vError } = await supabase.from('vendors').upsert({
            user_id: newUser.id,
            business_name: businessName,
            slug,
            tagline: vendorData.tagline,
            description: vendorData.description,
            category: vendorData.category,
            subcategories: vendorData.subcategories,
            city: vendorData.city,
            locality: vendorData.locality,
            cover_image: vendorData.coverImage,
            avatar: vendorData.avatar,
            gallery: vendorData.gallery,
            starting_price: vendorData.startingPrice,
            rating: 5.0,
            status: 'APPROVED',
            verification_status: 'VERIFIED',
            service_areas: vendorData.serviceAreas,
            specialties: vendorData.specialties,
          }, { onConflict: 'user_id' });
          if (vError) console.warn('Supabase vendor insert warning:', vError);
        } catch (e) {
          console.warn('Vendor creation exception:', e);
        }
      }
    }

    Storage.saveUser(newUser);
    Storage.setActiveUserId(newUser.id);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Signout warning:', e);
      }
    }
    Storage.setActiveUserId(null);
    setUser(null);
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedData };
    Storage.saveUser(updated);
    setUser(updated);

    if (isSupabaseConfigured && !user.id.startsWith('user-')) {
      await supabase
        .from('profiles')
        .update({
          name: updated.name,
          phone: updated.phone,
          city: updated.city,
          address: updated.address,
        })
        .eq('id', user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'CUSTOMER',
        isLoggedIn: Boolean(user),
        switchRole,
        login,
        loginAs,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
