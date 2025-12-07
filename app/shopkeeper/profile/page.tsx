'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ShopData {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rewardRate: number;
}

export default function ShopkeeperProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User form state
  const [userFormData, setUserFormData] = useState({
    name: '',
  });

  // Shop form state
  const [shopFormData, setShopFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    rewardRate: '',
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/shopkeeper/profile');

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 404 && data.error?.includes('Shop not found')) {
          router.push('/shopkeeper/setup');
          return;
        }
        throw new Error(data.error || 'Failed to fetch profile data');
      }

      const data = await response.json();
      setUserData(data.user);
      setShopData(data.shop);

      // Populate form data
      setUserFormData({
        name: data.user.name,
      });

      setShopFormData({
        name: data.shop.name,
        address: data.shop.address,
        lat: data.shop.location.lat.toString(),
        lng: data.shop.location.lng.toString(),
        rewardRate: data.shop.rewardRate.toString(),
      });
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUserData(data);
      setSuccess('User profile updated successfully!');
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShopUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch('/api/shopkeeper/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...shopFormData,
          lat: parseFloat(shopFormData.lat),
          lng: parseFloat(shopFormData.lng),
          rewardRate: parseFloat(shopFormData.rewardRate),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update shop profile');
      }

      setShopData(data);
      setSuccess('Shop profile updated successfully!');
    } catch (err) {
      console.error('Error updating shop profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update shop profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-lg text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!userData || !shopData) {
    return (
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Failed to load profile data'}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Settings</h1>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* User Profile Section */}
        <Card title="User Profile">
          <form onSubmit={handleUserUpdate} className="space-y-4">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-semibold text-blue-600">
                  {userData.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{userData.name}</h3>
                <p className="text-sm text-gray-500">{userData.email}</p>
              </div>
            </div>

            <Input
              label="Name"
              value={userFormData.name}
              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
              required
              className="text-black"
            />

            <div className="pt-2">
              <Button type="submit" isLoading={isSaving} disabled={isSaving}>
                Update User Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* Shop Profile Section */}
        <Card title="Shop Information">
          <form onSubmit={handleShopUpdate} className="space-y-4">
            <Input
              label="Shop Name"
              value={shopFormData.name}
              onChange={(e) =>
                setShopFormData({ ...shopFormData, name: e.target.value })
              }
              required
              className="text-black"
            />

            <Input
              label="Address"
              value={shopFormData.address}
              onChange={(e) =>
                setShopFormData({ ...shopFormData, address: e.target.value })
              }
              required
              className="text-black"
            />


            <Input
              label="Reward Rate (points per currency unit, e.g., 0.1 = 1 point per 10 units)"
              type="number"
              step="0.01"
              min="0"
              value={shopFormData.rewardRate}
              onChange={(e) =>
                setShopFormData({ ...shopFormData, rewardRate: e.target.value })
              }
              required
              className="text-black"
            />

            <div className="pt-2">
              <Button type="submit" isLoading={isSaving} disabled={isSaving}>
                Update Shop Profile
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
