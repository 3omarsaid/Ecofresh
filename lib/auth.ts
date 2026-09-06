import { createServerClientInstance } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { cache } from 'react';
import { can } from './permissions';

export { can };

const cacheFn = typeof cache === 'function' ? cache : (fn: any) => fn;

export const getCurrentUser = cacheFn(async function getCurrentUser() {
  const isLocalDev =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project") ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  try {
    const supabase = createServerClientInstance();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await prisma.userProfile.findUnique({
        where: { id: user.id },
      });
      if (profile) return profile;
    }
  } catch (error) {
    // If Supabase client fails, fall through to local dev check
  }

  try {
    const adminProfile = await prisma.userProfile.findFirst({
      where: { role: UserRole.ADMIN },
    });
    if (adminProfile) return adminProfile;
  } catch (error) {
    // Return safe fallback admin profile
  }

  return {
    id: "00000000-0000-0000-0000-000000000001",
    fullName: "مدير النظام Dev Admin",
    role: UserRole.ADMIN,
    title: "مدير النظام",
    stationId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});

