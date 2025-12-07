'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ShopSetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '28.7041', // Mock coordinates (Delhi)
    lng: '77.1025',
    rewardRate: '0.1',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/shop/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rewardRate: parseFloat(formData.rewardRate),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Setup failed');
        return;
      }

      router.push('/shopkeeper/dashboard');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Shop Setup</h1>

      <Card>
        <p className="text-gray-600 mb-6">
          Welcome! Let's set up your shop to start listing products.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Input
            label="Shop Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className='text-black'
          />

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            required
            className='text-black'

          />

          <Input
            label="Reward Rate (points per currency unit, e.g., 0.1 = 1 point per 10 units)"
            type="number"
            step="0.01"
            value={formData.rewardRate}
            onChange={(e) =>
              setFormData({ ...formData, rewardRate: e.target.value })
            }
            required
            className='text-black'

          />

          <Button type="submit" isLoading={isLoading} className="w-full">
            Complete Setup
          </Button>
        </form>
      </Card>
    </div>
  );
}

