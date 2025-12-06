import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Shop from '@/lib/models/Shop';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import { gemini } from '@/lib/openai';

export async function POST(request: NextRequest) {
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

    const [products, orders, completedOrders] = await Promise.all([
      Product.find({ shopId: shop._id }),
      Order.find({ shopId: shop._id })
        .populate('items.productId', 'name')
        .populate('userId', 'email'),
      Order.find({ shopId: shop._id, status: 'completed' })
        .populate('items.productId', 'name'),
    ]);

    const productPerformance = await Product.aggregate([
      { $match: { shopId: shop._id } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.productId',
          as: 'orderItems',
        },
      },
      {
        $project: {
          name: 1,
          sales: {
            $sum: {
              $map: {
                input: '$orderItems',
                as: 'order',
                in: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$$order.items',
                          as: 'item',
                          cond: { $eq: ['$$item.productId', '$_id'] },
                        },
                      },
                      as: 'item',
                      in: '$$item.quantity',
                    },
                  },
                },
              },
            },
          },
          revenue: {
            $sum: {
              $map: {
                input: '$orderItems',
                as: 'order',
                in: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$$order.items',
                          as: 'item',
                          cond: { $eq: ['$$item.productId', '$_id'] },
                        },
                      },
                      as: 'item',
                      in: { $multiply: ['$$item.price', '$$item.quantity'] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const analyticsPrompt = `You are an AI business analyst. Analyze the following shop data and provide actionable insights:

Shop: ${shop.name}
Total Orders: ${totalOrders}
Total Revenue: $${totalRevenue.toFixed(2)}
Average Order Value: $${averageOrderValue.toFixed(2)}
Reward Rate: ${shop.rewardRate * 100}% of purchase amount

Product Performance:
${productPerformance
  .map((p) => `- ${p.name}: ${p.sales} sales, $${p.revenue.toFixed(2)} revenue`)
  .join('\n')}

Recent Orders: ${Math.min(5, orders.length)} most recent
${orders
  .slice(0, 5)
  .map(
    (o) =>
      `- Order ${o._id.toString().slice(-8)}: $${o.total.toFixed(2)}, Status: ${o.status}, Customer: ${o.userId.email}`
  )
  .join('\n')}

Provide 3-5 actionable insights and recommendations for improving business performance. Focus on:
1. Product performance trends
2. Customer behavior patterns
3. Inventory management suggestions
4. Marketing opportunities
5. Revenue optimization strategies

Format as clear, concise bullet points.`;

    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const fullPrompt = `You are a helpful business analyst providing actionable insights for local shopkeepers.

${analyticsPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiInsights = response.text() || 'Unable to generate insights at this time.';

    return NextResponse.json({
      productPerformance: productPerformance.map((p) => ({
        name: p.name,
        sales: p.sales || 0,
        revenue: p.revenue || 0,
      })),
      aiInsights,
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

