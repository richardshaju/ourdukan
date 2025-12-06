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
    stock: number;
    shopId: {
      _id: string;
      name: string;
    };
  };
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
      setIsLoading(false);
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
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId);
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const updatedCart = cart.map((item: CartItem) =>
      item.productId === productId
        ? { ...item, quantity: Math.min(newQuantity, item.product?.stock || 0) }
        : item
    );
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    loadCart();
  };

  const removeItem = (productId: string) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const updatedCart = cart.filter((item: CartItem) => item.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    loadCart();
  };

  const getTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0
    );
  };

  const getShopId = () => {
    if (cartItems.length === 0) return null;
    return cartItems[0].shopId;
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading cart...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
        <Card className="text-center py-12">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Button onClick={() => router.push('/search')}>Start Shopping</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.productId}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.product?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.product?.shopId.name}
                  </p>
                  <p className="text-xl font-bold text-gray-900 mt-2">
                    ${item.product?.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= (item.product?.stock || 0)}
                      className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-right font-semibold">
                  Subtotal: ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">${getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold">${getTotal().toFixed(2)}</span>
              </div>
            </div>
            <Button
              onClick={() => router.push('/checkout')}
              className="w-full"
            >
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

