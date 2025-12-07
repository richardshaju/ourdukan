import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Shop from '@/lib/models/Shop';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'shopkeeper') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('name email role');
    const shop = await Shop.findOne({ ownerId: session.user.id });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found. Please set up your shop first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      shop: {
        id: shop._id.toString(),
        name: shop.name,
        address: shop.address,
        location: shop.location,
        rewardRate: shop.rewardRate,
      },
    });
  } catch (error) {
    console.error('Error fetching shopkeeper profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'shopkeeper') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const shop = await Shop.findOne({ ownerId: session.user.id });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, address, lat, lng, rewardRate } = body;

    if (name !== undefined) shop.name = name.trim();
    if (address !== undefined) shop.address = address.trim();
    if (lat !== undefined) shop.location.lat = parseFloat(lat);
    if (lng !== undefined) shop.location.lng = parseFloat(lng);
    if (rewardRate !== undefined) {
      const rate = parseFloat(rewardRate);
      if (rate < 0) {
        return NextResponse.json(
          { error: 'Reward rate must be non-negative' },
          { status: 400 }
        );
      }
      shop.rewardRate = rate;
    }

    await shop.save();

    return NextResponse.json({
      id: shop._id.toString(),
      name: shop.name,
      address: shop.address,
      location: shop.location,
      rewardRate: shop.rewardRate,
    });
  } catch (error) {
    console.error('Error updating shop profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
