'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import BottomNavigation from '@/components/customer/BottomNavigation';
import CustomerNavbar from '@/components/customer/Navbar';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'customer') {
      router.push('/');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role === 'customer') {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <CustomerNavbar />
        <main className="w-full">
          {children}
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return null;
}

