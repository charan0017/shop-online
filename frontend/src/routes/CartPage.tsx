import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface CartItem {
  productId: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
}

export default function CartPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const cartChannel = new BroadcastChannel('cart-channel');

  useEffect(() => {
    fetchCartAndProducts();
    return () => {
      cartChannel.close();
    };
  }, []);

  const fetchCartAndProducts = async () => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    try {
      const [cartResponse, productsResponse] = await Promise.all([
        fetch('/api/v1/cart', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/v1/products')
      ]);

      const [cartData, productsData] = await Promise.all([
        cartResponse.json(),
        productsResponse.json()
      ]);

      if (cartData.status && productsData.status) {
        setCartItems(cartData.cart);
        setProducts(productsData.products);
      } else {
        setError('Failed to fetch cart data');
      }
    } catch (error) {
      setError('Error loading cart');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    setUpdating(productId);
    try {
      const response = await fetch('/api/v1/cart', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity
        })
      });

      const data = await response.json();
      if (data.status) {
        setCartItems(data.cart);
        cartChannel.postMessage('cart-updated');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleClearCart = async () => {
    setShowClearCartModal(false);
    try {
      const response = await fetch('/api/v1/cart', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.status) {
        setCartItems([]);
        cartChannel.postMessage('cart-updated');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <p className="text-gray-600">Your cart is empty</p>
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showClearCartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clear Cart</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to remove all items from your cart?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowClearCartModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCart}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:flex-grow space-y-4">
          {cartItems.map((item) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return null;

            return (
              <div key={item.productId} className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
                <Link
                  to={`/products/${item.productId}`}
                  className="flex items-center space-x-4 flex-grow cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 object-contain bg-black/10 rounded-md"
                  />
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                    <span className="block mt-2 text-lg font-bold text-gray-900">
                      {product.currency} {(product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </Link>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                    disabled={updating === item.productId}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                    disabled={updating === item.productId}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:w-80 bg-white rounded-lg shadow-md p-4 h-fit space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Order Summary</h2>
          <div className="flex justify-between items-center text-lg font-bold text-gray-900">
            <span>Total:</span>
            <span>{products[0]?.currency} {calculateTotal().toLocaleString()}</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Proceed to Checkout
          </button>
          <button
            onClick={() => setShowClearCartModal(true)}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}
