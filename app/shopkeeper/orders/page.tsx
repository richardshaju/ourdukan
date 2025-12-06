'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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
  userId: {
    email: string;
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'packed' | 'completed'>('all');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const url = filter === 'all' ? '/api/orders' : `/api/orders?status=${filter}`;
      const response = await fetch(url);
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Orders</h1>

      <div className="mb-6 flex gap-2">
        {(['all', 'pending', 'packed', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order._id}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">Order ID: {order._id.slice(-8)}</p>
                <p className="text-sm text-gray-500">Customer: {order.userId.email}</p>
                <p className="text-sm text-gray-500">
                  Date: {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                {getStatusBadge(order.status)}
                <p className="text-xl font-bold text-gray-900 mt-2">
                  ${order.total.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  {order.rewardPointsEarned} points earned
                </p>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <h4 className="font-semibold mb-2">Items:</h4>
              <ul className="space-y-1">
                {order.items.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-600">
                    {item.productId.name} x {item.quantity} - ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              {order.status === 'pending' && (
                <Button
                  onClick={() => updateOrderStatus(order._id, 'packed')}
                  className="flex-1"
                >
                  Mark as Packed
                </Button>
              )}
              {order.status === 'packed' && (
                <Button
                  onClick={() => updateOrderStatus(order._id, 'completed')}
                  className="flex-1"
                >
                  Mark as Completed
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-500">No orders found.</p>
        </Card>
      )}
    </div>
  );
}

