'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface Reward {
  _id: string;
  shopId: {
    name: string;
  };
  points: number;
  description: string;
  claimedAt: Date | null;
  createdAt: string;
}

export default function RewardsPage() {
  const { data: session } = useSession();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchRewards();
      fetchUserPoints();
    }
  }, [session]);

  const fetchUserPoints = async () => {
    try {
      const response = await fetch('/api/user/points');
      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.rewardPoints || 0);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/rewards');
      if (response.ok) {
        const data = await response.json();
        setRewards(data);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimReward = async (rewardId: string, pointsRequired: number) => {
    if (userPoints < pointsRequired) {
      alert('Insufficient points');
      return;
    }

    try {
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId }),
      });

      if (response.ok) {
        fetchRewards();
        fetchUserPoints();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to claim reward');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Failed to claim reward');
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading rewards...</div>;
  }

  const availableRewards = rewards.filter((r) => !r.claimedAt);
  const claimedRewards = rewards.filter((r) => r.claimedAt);

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Rewards</h1>

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Available Points</p>
            <p className="text-3xl font-bold text-blue-600">{userPoints}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Rewards</p>
            <p className="text-2xl font-semibold text-gray-900">
              {claimedRewards.length}
            </p>
          </div>
        </div>
      </Card>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Available Rewards
        </h2>
        {availableRewards.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">No rewards available at this time.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableRewards.map((reward) => (
              <Card key={reward._id}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {reward.description}
                  </h3>
                  <Badge variant="info">{reward.points} pts</Badge>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  From: {reward.shopId.name}
                </p>
                <Button
                  onClick={() => claimReward(reward._id, reward.points)}
                  disabled={userPoints < reward.points}
                  className="w-full"
                >
                  Claim Reward
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {claimedRewards.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Claimed Rewards
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {claimedRewards.map((reward) => (
              <Card key={reward._id}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {reward.description}
                  </h3>
                  <Badge variant="success">Claimed</Badge>
                </div>
                <p className="text-sm text-gray-500">
                  From: {reward.shopId.name}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Claimed on:{' '}
                  {new Date(reward.claimedAt!).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

