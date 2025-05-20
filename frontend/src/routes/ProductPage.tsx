import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  quantity: number;
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);
  const cartChannel = new BroadcastChannel('cart-channel');

  useEffect(() => {
    fetchProduct();
    return () => {
      cartChannel.close();
    };
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/v1/products/${id}`);
      const data = await response.json();

      if (data.status) {
        setProduct(data.product);
      } else {
        setError('Product not found');
      }
    } catch (error) {
      setError('Error loading product');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!localStorage.getItem('token')) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setAdding(true);
    try {
      const response = await fetch('/api/v1/cart', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId: id,
          quantity: 1
        })
      });

      const data = await response.json();
      if (data.status) {
        cartChannel.postMessage('cart-updated');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Unavailable</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the product you're looking for. It might be temporarily unavailable or has been removed.
          </p>
          <Link
            to="/"
            className="bg-indigo-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors inline-block"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2">
          <img
            src={product.image}
            alt={product.name}
            className="w-full aspect-square object-contain bg-black/10 rounded-lg"
          />
        </div>
        <div className="lg:w-1/2 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600">{product.description}</p>
          <div className="text-2xl font-bold text-gray-900">
            {product.currency} {product.price.toLocaleString()}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
          >
            {adding ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Adding to Cart...
              </div>
            ) : (
              'Add to Cart'
            )}
          </button>
          <Link
            to="/"
            className="block text-center text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    </div>
  );
}