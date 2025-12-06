'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  shopId: {
    _id: string;
    name: string;
    address: string;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products`);
      if (response.ok) {
        const products = await response.json();
        const foundProduct = products.find(
          (p: Product) => p._id === params.id
        );
        setProduct(foundProduct || null);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async () => {
    if (!product || product.stock === 0) return;

    setIsAdding(true);
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = cart.findIndex(
        (item: any) => item.productId === product._id
      );

      if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += quantity;
      } else {
        cart.push({
          productId: product._id,
          quantity,
          shopId: product.shopId._id,
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <Badge variant={product.stock > 0 ? 'success' : 'danger'}>
              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Description
          </h2>
          <p className="text-gray-600">{product.description || 'No description available.'}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Shop Info</h2>
          <p className="text-gray-700 font-medium">{product.shopId.name}</p>
          <p className="text-gray-600 text-sm">{product.shopId.address}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="text-gray-900">{product.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock Available</p>
              <p className="text-gray-900">{product.stock} units</p>
            </div>
          </div>
        </div>

        {product.stock > 0 && (
          <div className="border-t pt-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium text-gray-700">
                Quantity:
              </label>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))
                }
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <span className="text-sm text-gray-500">
                Max: {product.stock}
              </span>
            </div>
            <Button
              onClick={addToCart}
              isLoading={isAdding}
              className="w-full"
            >
              Add to Cart
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

