'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import FeedbackForm from '@/components/customer/FeedbackForm';

interface OrderItem {
  productId: {
    _id: string;
    name: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  shopId: {
    name: string;
  };
  items: OrderItem[];
  total: number;
  status: 'pending' | 'packed' | 'completed';
  rewardPointsEarned: number;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'warning' as const,
      packed: 'info' as const,
      completed: 'success' as const,
    };
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading orders...</div>;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order._id}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">Order ID: {order._id.slice(-8)}</p>
                <p className="text-sm text-gray-500">Shop: {order.shopId.name}</p>
                <p className="text-sm text-gray-500">
                  Date: {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                {getStatusBadge(order.status)}
                <p className="text-xl font-bold text-gray-900 mt-2">
                  ${order.total.toFixed(2)}
                </p>
                <p className="text-sm text-green-600">
                  +{order.rewardPointsEarned} points earned
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 text-black">Items:</h4>
              <ul className="space-y-1">
                {order.items.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-600">
                    {item.productId.name} x {item.quantity} - ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feedback Form for Completed Orders */}
            {order.status === 'completed' && (
              <FeedbackForm
                orderId={order._id}
                shopName={order.shopId.name}
              />
            )}
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-500">No orders yet. Start shopping!</p>
        </Card>
      )}
    </div>
  );
}

