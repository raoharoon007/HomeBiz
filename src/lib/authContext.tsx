import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Storage } from './storage';

// Diverse set of real avatar photos for Pakistani / South Asian community
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
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, role: UserRole, city: string, businessName?: string) => User;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => Storage.getActiveUser());

  useEffect(() => {
    const handleStorage = () => {
      setUser(Storage.getActiveUser());
    };
    window.addEventListener('hb_storage_update', handleStorage);
    return () => window.removeEventListener('hb_storage_update', handleStorage);
  }, []);

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

  const login = (email: string, password: string): boolean => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = Storage.authenticateUser(normalizedEmail, password);
    if (!existing) {
      return false;
    }

    Storage.setActiveUserId(existing.id);
    setUser(existing);
    return true;
  };

  const register = (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    city: string,
    businessName?: string
  ): User => {
    const normalizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();
    const existing = Storage.getUsers().find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('This email is already registered. Please sign in instead.');
    }

    if (!normalizedEmail || !sanitizedPassword || sanitizedPassword.length < 6) {
      throw new Error('A valid email and a password of at least 6 characters are required.');
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: sanitizedPassword,
      role,
      city,
      avatar: getRandomAvatar(),
      createdAt: new Date().toISOString(),
    };

    if (role === 'SELLER' && businessName) {
      const vendorId = `vendor-${Date.now()}`;
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      newUser.sellerProfileId = vendorId;

      Storage.saveVendor({
        id: vendorId,
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
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
        ],
        startingPrice: 1500,
        rating: 5.0,
        reviewCount: 1,
        responseTime: '< 30 mins',
        experienceYears: 2,
        status: 'APPROVED',
        verificationStatus: 'VERIFIED',
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
      });
    }

    const userToPersist: User = {
      ...newUser,
      password: sanitizedPassword,
    };

    Storage.saveUser(userToPersist);
    Storage.setActiveUserId(userToPersist.id);
    setUser(userToPersist);
    return userToPersist;
  };

  const logout = () => {
    Storage.setActiveUserId(null);
    setUser(null);
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedData };
    Storage.saveUser(updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'CUSTOMER',
        isLoggedIn: Boolean(user),
        switchRole,
        login,
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
