import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/lib/models/Shop';
import Feedback from '@/lib/models/Feedback';

// Check if a shop qualifies as Elite class
// Elite class: 3+ ratings (more than 5 total)
async function isEliteShop(shopId: string): Promise<boolean> {
  try {
    const feedbacks = await Feedback.find({ shopId, rating: { $gte: 3 } });
    console.log('Feedbacks:', feedbacks.length);
    return feedbacks.length >= 5;
  } catch (error) {
    console.error('Error checking Elite status:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // Fetch all shops
    const shops = await Shop.find({})
      .select('name address location rewardRate')
      .sort({ createdAt: -1 });

    // Check Elite status for all shops
    const shopsWithEliteStatus = await Promise.all(
      shops.map(async (shop) => {
        const isElite = await isEliteShop(shop._id.toString());
        return {
          ...shop.toObject(),
          isElite,
        };
      })
    );

    // If location is provided, calculate distances and sort by proximity
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const shopsWithDistance = shopsWithEliteStatus.map((shop) => {
        const distance = calculateDistance(
          userLat,
          userLng,
          shop.location.lat,
          shop.location.lng
        );
        return {
          ...shop,
          distance,
        };
      });

      // Sort by distance (nearest first)
      shopsWithDistance.sort((a, b) => a.distance - b.distance);

      return NextResponse.json(shopsWithDistance);
    }

    return NextResponse.json(shopsWithEliteStatus);
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two coordinates in kilometers
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
