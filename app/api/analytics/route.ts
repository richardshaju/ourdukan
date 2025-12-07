import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Shop from '@/lib/models/Shop';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import Feedback from '@/lib/models/Feedback';
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
        .populate('items.productId', 'name category stock')
        .populate('userId', 'email')
        .sort({ createdAt: -1 }),
      Order.find({ shopId: shop._id, status: 'completed' })
        .populate('items.productId', 'name category stock'),
    ]);

    // Enhanced product performance with stock and category data
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
          _id: 1,
          name: 1,
          category: 1,
          stock: 1,
          price: 1,
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
          orderCount: { $size: '$orderItems' },
        },
      },
    ]);

    // Get products with populated data for stock analysis
    const productsWithData = await Product.find({ shopId: shop._id });

    // Calculate time-based sales (last 7 days, 30 days)
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentOrders7Days = completedOrders.filter(
      (order) => new Date(order.createdAt) >= last7Days
    );
    const recentOrders30Days = completedOrders.filter(
      (order) => new Date(order.createdAt) >= last30Days
    );

    // Calculate sales by category
    const categorySales: Record<string, { sales: number; revenue: number }> = {};
    productPerformance.forEach((product) => {
      const category = product.category || 'Uncategorized';
      if (!categorySales[category]) {
        categorySales[category] = { sales: 0, revenue: 0 };
      }
      categorySales[category].sales += product.sales || 0;
      categorySales[category].revenue += product.revenue || 0;
    });

    // Calculate daily sales trend (last 7 days)
    const dailySales: Record<string, { sales: number; revenue: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailySales[dateStr] = { sales: 0, revenue: 0 };
    }

    recentOrders7Days.forEach((order) => {
      const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
      if (dailySales[dateStr]) {
        order.items.forEach((item: any) => {
          dailySales[dateStr].sales += item.quantity || 0;
          dailySales[dateStr].revenue += (item.price || 0) * (item.quantity || 0);
        });
      }
    });

    // Calculate inventory turnover (sales velocity)
    const inventoryAnalysis = productPerformance.map((product) => {
      const productData = productsWithData.find(
        (p) => p._id.toString() === product._id.toString()
      );
      const stock = productData?.stock || 0;
      const sales = product.sales || 0;
      const turnoverRate = stock > 0 ? sales / stock : sales > 0 ? 999 : 0;
      const stockStatus = stock === 0 ? 'out_of_stock' : stock < 10 ? 'low_stock' : 'in_stock';

      return {
        ...product,
        stock,
        turnoverRate,
        stockStatus,
        averagePrice: product.revenue > 0 && product.sales > 0 ? product.revenue / product.sales : 0,
      };
    });

    // Sort products by different metrics
    const topSellingProducts = [...inventoryAnalysis]
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 5);

    const topRevenueProducts = [...inventoryAnalysis]
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, 5);

    const lowStockProducts = [...inventoryAnalysis]
      .filter((p) => p.stockStatus === 'low_stock' || p.stockStatus === 'out_of_stock')
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);

    const slowMovingProducts = [...inventoryAnalysis]
      .filter((p) => (p.sales || 0) === 0 && p.stock > 0)
      .slice(0, 5);

    // Fetch feedbacks for the shop
    const feedbacks = await Feedback.find({ shopId: shop._id })
      .populate('userId', 'name email')
      .populate('orderId', 'total createdAt')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const ratings = feedbacks.map((f) => f.rating);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

    // Generate AI summary of feedbacks
    let feedbackSummary = '';
    if (feedbacks.length > 0) {
      const feedbackPrompt = `You are a customer feedback analyst. Analyze the following customer feedbacks and provide a comprehensive summary:

Shop: ${shop.name}
Total Feedbacks: ${feedbacks.length}
Average Rating: ${averageRating.toFixed(1)}/5.0

Customer Feedbacks:
${feedbacks
  .map((f, idx) => {
    let userName = 'Customer';
    if (typeof f.userId === 'object' && f.userId !== null) {
      const user = f.userId as any;
      userName = user.name || user.email || 'Customer';
    }
    const comment = f.comment || 'No comment provided';
    return `${idx + 1}. Rating: ${f.rating}/5 - ${userName}\n   Comment: ${comment}`;
  })
  .join('\n\n')}

Provide a comprehensive summary that includes:
1. Overall customer satisfaction trends
2. Common themes and patterns in feedback
3. Key strengths mentioned by customers
4. Areas for improvement based on feedback
5. Actionable recommendations

Format as clear, well-structured paragraphs with bullet points for recommendations.`;

      try {
        const feedbackModel = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const feedbackResult = await feedbackModel.generateContent(feedbackPrompt);
        const feedbackResponse = await feedbackResult.response;
        feedbackSummary = feedbackResponse.text() || 'Unable to generate feedback summary at this time.';
      } catch (error) {
        console.error('Error generating feedback summary:', error);
        feedbackSummary = 'Unable to generate feedback summary at this time.';
      }
    }

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
  .map((o) => {
    const customerEmail = 
      typeof o.userId === 'object' && 
      o.userId !== null && 
      'email' in o.userId 
        ? (o.userId as { email: string }).email 
        : 'N/A';
    return `- Order ${o._id.toString().slice(-8)}: $${o.total.toFixed(2)}, Status: ${o.status}, Customer: ${customerEmail}`;
  })
  .join('\n')}

Provide 3-5 actionable insights and recommendations for improving business performance. Focus on:
1. Product performance trends
2. Customer behavior patterns
3. Inventory management suggestions
4. Marketing opportunities
5. Revenue optimization strategies

Format as clear, concise bullet points.`;

    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const fullPrompt = `You are a helpful business analyst providing actionable insights for local shopkeepers.

${analyticsPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiInsights = response.text() || 'Unable to generate insights at this time.';

    return NextResponse.json({
      // Summary metrics
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        revenue7Days: recentOrders7Days.reduce((sum, order) => sum + order.total, 0),
        revenue30Days: recentOrders30Days.reduce((sum, order) => sum + order.total, 0),
        orders7Days: recentOrders7Days.length,
        orders30Days: recentOrders30Days.length,
      },
      // Product performance with detailed metrics
      productPerformance: inventoryAnalysis.map((p) => ({
        id: p._id?.toString(),
        name: p.name,
        category: p.category || 'Uncategorized',
        sales: p.sales || 0,
        revenue: p.revenue || 0,
        stock: p.stock || 0,
        stockStatus: p.stockStatus,
        turnoverRate: p.turnoverRate,
        averagePrice: p.averagePrice,
        orderCount: p.orderCount || 0,
      })),
      // Category performance
      categoryPerformance: Object.entries(categorySales).map(([category, data]) => ({
        category,
        sales: data.sales,
        revenue: data.revenue,
      })),
      // Time-based trends
      dailySalesTrend: Object.entries(dailySales).map(([date, data]) => ({
        date,
        sales: data.sales,
        revenue: data.revenue,
      })),
      // Top performers
      topSellingProducts: topSellingProducts.map((p) => ({
        name: p.name,
        sales: p.sales || 0,
        revenue: p.revenue || 0,
        stock: p.stock,
      })),
      topRevenueProducts: topRevenueProducts.map((p) => ({
        name: p.name,
        sales: p.sales || 0,
        revenue: p.revenue || 0,
        stock: p.stock,
      })),
      // Inventory alerts
      lowStockProducts: lowStockProducts.map((p) => ({
        name: p.name,
        stock: p.stock,
        stockStatus: p.stockStatus,
        sales: p.sales || 0,
      })),
      slowMovingProducts: slowMovingProducts.map((p) => ({
        name: p.name,
        stock: p.stock,
        sales: p.sales || 0,
        revenue: p.revenue || 0,
      })),
      // Feedback data
      feedback: feedbacks.length > 0 ? {
        feedbacks: feedbacks.map((f) => {
          const user = typeof f.userId === 'object' && f.userId !== null ? (f.userId as unknown as { name?: string; email: string }) : null;
          const order = typeof f.orderId === 'object' && f.orderId !== null ? (f.orderId as unknown as { total: number; createdAt: Date }) : null;
          return {
            _id: f._id.toString(),
            rating: f.rating,
            comment: f.comment || '',
            userId: {
              name: user?.name || '',
              email: user?.email || '',
            },
            orderId: {
              total: order?.total || 0,
              createdAt: order?.createdAt?.toString() || new Date().toString(),
            },
            createdAt: f.createdAt.toString(),
          };
        }),
        averageRating: averageRating.toFixed(1),
        totalFeedbacks: feedbacks.length,
        aiSummary: feedbackSummary,
      } : undefined,
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

