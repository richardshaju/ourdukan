'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Location {
  name: string;
  address: string;
}

import { Space_Grotesk} from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});


export default function CustomerNavbar() {
  const router = useRouter();
  const [location, setLocation] = useState<Location>({
    name: 'Bengaluru',
    address: 'Sarjapur Marathahalli Road, Kaikondrahalli,...',
  });

  useEffect(() => {
    // Load location from localStorage if available
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        setLocation(JSON.parse(savedLocation));
      } catch (error) {
        console.error('Error parsing saved location:', error);
      }
    }
  }, []);

  const handleLocationClick = () => {
    // TODO: Implement location picker/selector
    // For now, this could open a modal or navigate to a location selection page
    console.log('Location clicked - implement location picker');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Branding */}
          <Link href="/search" className="flex items-center">
            <h1 className={`text-2xl font-bold text-purple-600 ${spaceGrotesk.className}`}>OurDukan</h1>
          </Link>

          {/* Location */}
          <button
            onClick={handleLocationClick}
            className="flex items-center gap-2 flex-1 mx-4 max-w-[200px]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-purple-600 shrink-0"
            >
              <path
                d="M8 1C5.24 1 3 3.24 3 6C3 10.5 8 15 8 15C8 15 13 10.5 13 6C13 3.24 10.76 1 8 1ZM8 8C7.17 8 6.5 7.33 6.5 6.5C6.5 5.67 7.17 5 8 5C8.83 5 9.5 5.67 9.5 6.5C9.5 7.33 8.83 8 8 8Z"
                fill="currentColor"
              />
            </svg>
            <div className="text-left min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {location.name}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {location.address}
              </p>
            </div>
          </button>

        </div>
      </div>
    </nav>
  );
}

