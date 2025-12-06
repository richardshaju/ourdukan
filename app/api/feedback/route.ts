import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Feedback from '@/lib/models/Feedback';
import Order from '@/lib/models/Order';
import Shop from '@/lib/models/Shop';

// Submit feedback
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, rating, comment } = await request.json();

    if (!orderId || !rating) {
      return NextResponse.json(
        { error: 'Order ID and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the order belongs to the user and is completed
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (order.status !== 'completed') {
      return NextResponse.json(
        { error: 'Feedback can only be submitted for completed orders' },
        { status: 400 }
      );
    }

    // Check if feedback already exists for this order
    const existingFeedback = await Feedback.findOne({ orderId });
    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback has already been submitted for this order' },
        { status: 400 }
      );
    }

    // Create new feedback
    const feedback = new Feedback({
      userId: session.user.id,
      shopId: order.shopId,
      orderId: order._id,
      rating,
      comment: comment || '',
    });

    await feedback.save();

    return NextResponse.json(
      {
        message: 'Feedback submitted successfully',
        feedback,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get feedback for a shop (shopkeeper view)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (session.user.role === 'shopkeeper') {
      // Shopkeeper can view feedback for their shop
      const shop = await Shop.findOne({ ownerId: session.user.id });
      
      if (!shop) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }

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

      return NextResponse.json({
        feedbacks,
        averageRating: averageRating.toFixed(1),
        totalFeedbacks: feedbacks.length,
      });
    } else if (session.user.role === 'customer') {
      // Customer can view their own feedback
      const feedbacks = await Feedback.find({ userId: session.user.id })
        .populate('shopId', 'name')
        .populate('orderId', 'total createdAt')
        .sort({ createdAt: -1 });

      return NextResponse.json({ feedbacks });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
