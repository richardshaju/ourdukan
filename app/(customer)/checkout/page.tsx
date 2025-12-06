'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface CartItem {
  productId: string;
  quantity: number;
  shopId: string;
  product?: {
    _id: string;
    name: string;
    price: number;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
      router.push('/cart');
      return;
    }

    try {
      const products = await fetch('/api/products').then((res) => res.json());
      
      const itemsWithProducts = cart.map((item: CartItem) => {
        const product = products.find((p: any) => p._id === item.productId);
        return { ...item, product };
      }).filter((item: CartItem) => item.product);

      setCartItems(itemsWithProducts);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const getTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0
    );
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setIsProcessing(true);

    try {
      const shopId = cartItems[0].shopId;
      const items = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shopId }),
      });

      if (response.ok) {
        localStorage.removeItem('cart');
        router.push('/orders');
      } else {
        const error = await response.json();
        alert(error.error || 'Checkout failed');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Order Items">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex justify-between items-center border-b pb-4">
                <div>
                  <p className="font-semibold">{item.product?.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold">
                  ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Payment Summary">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">${getTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-semibold">$0.00</span>
            </div>
            <div className="border-t pt-4 flex justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold">${getTotal().toFixed(2)}</span>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Mock Payment:</strong> This is a prototype. Payment will be
                automatically processed.
              </p>
            </div>

            <Button
              onClick={handleCheckout}
              isLoading={isProcessing}
              className="w-full mt-4"
            >
              Complete Order
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

