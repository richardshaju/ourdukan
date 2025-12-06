import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Shop from '@/lib/models/Shop';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'shopkeeper') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const shop = await Shop.findOne({ ownerId: session.user.id });

    if (!shop) {
      return NextResponse.json(
        {
          totalOrders: 0,
          totalRevenue: 0,
          totalProducts: 0,
          pendingOrders: 0,
        },
        { status: 200 }
      );
    }

    const [totalOrders, totalRevenue, totalProducts, pendingOrders] =
      await Promise.all([
        Order.countDocuments({ shopId: shop._id }),
        Order.aggregate([
          { $match: { shopId: shop._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Product.countDocuments({ shopId: shop._id }),
        Order.countDocuments({ shopId: shop._id, status: 'pending' }),
      ]);

    return NextResponse.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalProducts,
      pendingOrders,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

