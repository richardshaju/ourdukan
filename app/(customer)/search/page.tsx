'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  images: string[];
  quantity?: string;
  discount?: number;
  isChilled?: boolean;
  shopId: {
    _id: string;
    name: string;
    address: string;
  };
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface Shop {
  _id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rewardRate: number;
  distance?: number;
}

export default function SearchPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const filterByCategory = (category: string) => {
    if (allProducts.length === 0) return;
    const filtered = allProducts.filter(
      (product) => product.category.toLowerCase() === category.toLowerCase()
    );
    setProducts(filtered);
  };

  useEffect(() => {
    loadCart();
    fetchAllProducts();
    fetchShops();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (selectedCategory && allProducts.length > 0) {
      // Filter by category when no search query
      filterByCategory(selectedCategory);
    } else if (!selectedCategory && !searchQuery) {
      fetchShops();
    }
  }, [searchQuery, selectedCategory, allProducts.length]);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
  };

  const getCartQuantity = (productId: string) => {
    const item = cart.find((item) => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const addToCart = (product: Product) => {
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = currentCart.find(
      (item: CartItem) => item.productId === product._id
    );

    let updatedCart;
    if (existingItem) {
      updatedCart = currentCart.map((item: CartItem) =>
        item.productId === product._id
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
          : item
      );
    } else {
      updatedCart = [
        ...currentCart,
        { productId: product._id, quantity: 1, shopId: product.shopId._id },
      ];
    }

    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const product = products.find((p) => p._id === productId);

    if (newQuantity < 1) {
      const updatedCart = currentCart.filter(
        (item: CartItem) => item.productId !== productId
      );
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      setCart(updatedCart);
      return;
    }

    const updatedCart = currentCart.map((item: CartItem) =>
      item.productId === productId
        ? {
            ...item,
            quantity: Math.min(newQuantity, product?.stock || 0),
          }
        : item
    );

    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const fetchAllProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setAllProducts(data);
        if (!selectedCategory) {
          setProducts(data);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/products?search=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShops = async () => {
    setIsLoading(true);
    try {
      // Try to get user location from localStorage
      const savedLocation = localStorage.getItem('userLocation');
      let url = '/api/shops';
      
      if (savedLocation) {
        try {
          const location = JSON.parse(savedLocation);
          // If location has coordinates, use them
          if (location.lat && location.lng) {
            url = `/api/shops?lat=${location.lat}&lng=${location.lng}`;
          }
        } catch (error) {
          console.error('Error parsing saved location:', error);
        }
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setShops(data);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique categories with sample product images
  const getCategoryData = () => {
    const categoryMap = new Map<string, { name: string; image: string; bgColor: string }>();
    
    allProducts.forEach((product) => {
      if (product.category && product.category.trim() !== '') {
        if (!categoryMap.has(product.category)) {
          // Get first product image from this category, or use placeholder
          const categoryImage = product.images && product.images.length > 0 
            ? product.images[0] 
            : '';
          
          // Assign background colors based on category (similar to the reference image)
          const bgColors = [
            'bg-green-50', 'bg-orange-50', 'bg-blue-50', 
            'bg-pink-50', 'bg-purple-50', 'bg-yellow-50'
          ];
          const colorIndex = categoryMap.size % bgColors.length;
          
          categoryMap.set(product.category, {
            name: product.category,
            image: categoryImage,
            bgColor: bgColors[colorIndex],
          });
        }
      }
    });
    
    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const categories = getCategoryData();

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory('');
      setProducts(allProducts);
    } else {
      setSelectedCategory(categoryName);
      setSearchQuery(''); // Clear search when selecting category
    }
  };

  // Group products by store
  const productsByStore = products.reduce((acc, product) => {
    if (!product.shopId || !product.shopId._id) return acc;
    const storeId = product.shopId._id;
    if (!acc[storeId]) {
      acc[storeId] = {
        store: product.shopId,
        products: [],
      };
    }
    acc[storeId].products.push(product);
    return acc;
  }, {} as Record<string, { store: { _id: string; name: string; address: string }; products: Product[] }>);

  const storeGroups = Object.values(productsByStore);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Search bar section */}
      <div className="bg-gradient-to-b from-purple-50 to-purple-100/50 px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for groceries and more"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pr-12 bg-white text-black rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 19L14.65 14.65"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Shop by category section */}
      {!searchQuery && !selectedCategory && categories.length > 0 && (
        <div className="px-4 py-6 bg-white">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shop by category</h2>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => handleCategoryClick(category.name)}
                className={`${category.bgColor} rounded-lg p-3 flex flex-col items-center transition-transform hover:scale-105 active:scale-95`}
              >
                <div className="w-full h-24 mb-2 bg-white rounded-md flex items-center justify-center overflow-hidden">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.nextElementSibling) {
                          (target.nextElementSibling as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div className="hidden items-center justify-center text-gray-400 text-xs">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16 8V24M8 16H24"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-900 text-center leading-tight">
                  {category.name}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products section */}
      <div className="px-4 py-6 bg-white">
        {searchQuery && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Search results for "{searchQuery}"
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}

        {selectedCategory && !searchQuery && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Category: {selectedCategory}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}

        {!searchQuery && !selectedCategory && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Shops Nearby</h3>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : !searchQuery && !selectedCategory && shops.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {shops.map((shop) => (
              <Link
                key={shop._id}
                href={`/search?shopId=${shop._id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        {shop.name}
                      </h4>
                      <div className="flex items-center gap-1 mb-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-purple-600 shrink-0"
                        >
                          <path
                            d="M8 1C5.24 1 3 3.24 3 6C3 10.5 8 15 8 15C8 15 13 10.5 13 6C13 3.24 10.76 1 8 1ZM8 8C7.17 8 6.5 7.33 6.5 6.5C6.5 5.67 7.17 5 8 5C8.83 5 9.5 5.67 9.5 6.5C9.5 7.33 8.83 8 8 8Z"
                            fill="currentColor"
                          />
                        </svg>
                        <p className="text-sm text-gray-600">{shop.address}</p>
                      </div>
                      {shop.distance !== undefined && (
                        <p className="text-xs text-gray-500 mt-1">
                          {shop.distance < 1
                            ? `${(shop.distance * 1000).toFixed(0)}m away`
                            : `${shop.distance.toFixed(1)}km away`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="7" cy="7" r="5" fill="#22C55E" />
                      </svg>
                      <span className="text-xs font-medium text-green-600">Open</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-yellow-500"
                      >
                        <path
                          d="M8 1L10.09 5.26L15 6.11L11.5 9.26L12.18 14.02L8 11.77L3.82 14.02L4.5 9.26L1 6.11L5.91 5.26L8 1Z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {shop.rewardRate * 100}% rewards on purchases
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : !searchQuery && !selectedCategory && shops.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto text-gray-300"
              >
                <path
                  d="M32 12C20.95 12 12 20.95 12 32C12 43.05 20.95 52 32 52C43.05 52 52 43.05 52 32C52 20.95 43.05 12 32 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M44 44L36 36"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">No shops nearby</p>
            <p className="text-gray-400 text-sm mt-2">
              Check back later for new shops
            </p>
          </div>
        ) : storeGroups.length > 0 ? (
          <div className="space-y-6">
            {storeGroups.map((group) => (
              <div key={group.store._id} className="space-y-3">
                {/* Store header */}
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-purple-700">
                        {group.store.name}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7 1C4.79 1 3 2.79 3 5C3 9 7 13 7 13C7 13 11 9 11 5C11 2.79 9.21 1 7 1ZM7 7.25C6.31 7.25 5.75 6.69 5.75 6C5.75 5.31 6.31 4.75 7 4.75C7.69 4.75 8.25 5.31 8.25 6C8.25 6.69 7.69 7.25 7 7.25Z"
                            fill="#9333EA"
                          />
                        </svg>
                        <p className="text-xs text-gray-600">{group.store.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="7" cy="7" r="5" fill="#22C55E" />
                      </svg>
                      <span className="text-xs font-medium text-green-600">Open</span>
                    </div>
                  </div>
                </div>

                {/* Products grid for this store */}
                <div className="grid grid-cols-2 gap-4">
                  {group.products.map((product) => {
                    const quantity = getCartQuantity(product._id);
                    const discount = product.discount || 0;
                    const originalPrice = product.originalPrice || product.price;
                    const hasDiscount = discount > 0 && originalPrice > product.price;

                    return (
                      <div
                        key={product._id}
                        className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden relative"
                      >
                        {/* Discount badge */}
                        {hasDiscount && (
                          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded z-10">
                            {discount}% OFF
                          </div>
                        )}

                        {/* Chilled badge */}
                        {product.isChilled && (
                          <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded flex items-center gap-1 z-10">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 1V11M1 6H11"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                            CHILLED
                          </div>
                        )}

                        {/* Product image */}
                        <div className="relative w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                if (target.nextElementSibling) {
                                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs" style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}>
                            No Image
                          </div>

                          {/* Add to cart button or quantity selector */}
                          {quantity === 0 ? (
                            <button
                              onClick={() => addToCart(product)}
                              disabled={product.stock === 0}
                              className="absolute bottom-2 right-2 w-8 h-8 bg-white border-2 border-green-500 rounded flex items-center justify-center hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M8 3V13M3 8H13"
                                  stroke="#22C55E"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          ) : (
                            <div className="absolute bottom-2 right-2 flex items-center bg-white border-2 border-green-500 rounded overflow-hidden">
                              <button
                                onClick={() => updateQuantity(product._id, quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-50 font-semibold"
                              >
                                -
                              </button>
                              <div className="w-8 h-7 flex items-center justify-center text-green-600 font-semibold bg-green-50">
                                {quantity}
                              </div>
                              <button
                                onClick={() => updateQuantity(product._id, quantity + 1)}
                                disabled={quantity >= product.stock}
                                className="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-50 font-semibold disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Product details */}
                        <div className="p-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500 mb-2">
                            {product.quantity || product.category}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              ₹{product.price.toFixed(0)}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through">
                                ₹{originalPrice.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && products.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto text-gray-300"
              >
                <path
                  d="M32 12C20.95 12 12 20.95 12 32C12 43.05 20.95 52 32 52C43.05 52 52 43.05 52 32C52 20.95 43.05 12 32 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M44 44L36 36"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">
              {searchQuery
                ? 'No products found'
                : selectedCategory
                ? `No products in ${selectedCategory} category`
                : 'No products available'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery
                ? 'Try searching with different keywords'
                : 'Check back later for new products'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
