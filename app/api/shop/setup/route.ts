import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Shop from '@/lib/models/Shop';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'shopkeeper') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const existingShop = await Shop.findOne({ ownerId: session.user.id });
    if (existingShop) {
      return NextResponse.json(
        { error: 'Shop already exists for this user' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, address, lat, lng, rewardRate } = body;

    if (!name || !address || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const shop = new Shop({
      name,
      address,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      },
      ownerId: session.user.id,
      rewardRate: rewardRate || 0.1,
    });

    await shop.save();

    return NextResponse.json(shop, { status: 201 });
  } catch (error) {
    console.error('Error creating shop:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

