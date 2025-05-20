import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  quantity: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const cartChannel = new BroadcastChannel('cart-channel');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/products');
      const data = await response.json();
      if (data.status) {
        setProducts(data.products);
      } else {
        setError('Failed to fetch products');
      }
    } catch (error) {
      setError('Error fetching products');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
      return;
    }

    setAddingToCart(productId);
    try {
      const response = await fetch('/api/v1/cart', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId,
          quantity: 1
        })
      });

      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message);
      }
      
      // Broadcast cart update
      cartChannel.postMessage('cart-updated');
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(null);
    }
  };

  useEffect(() => {
    return () => {
      cartChannel.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <Link to={`/products/${product.id}`} className="block">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-64 object-contain bg-black/10"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    {product.currency} {product.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
            <div className="px-4 pb-4">
              <button
                onClick={() => handleAddToCart(product.id)}
                disabled={addingToCart === product.id}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
              >
                {addingToCart === product.id ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Adding...
                  </div>
                ) : (
                  'Add to Cart'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}