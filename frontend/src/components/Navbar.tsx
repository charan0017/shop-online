import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface CartItem {
  productId: string;
  quantity: number;
}

export default function Navbar() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = localStorage.getItem('token') !== null;
  const userInitials = user?.name ? user.name.charAt(0).toUpperCase() : '';
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const cartChannel = new BroadcastChannel('cart-channel');

  useEffect(() => {
    const fetchUser = async () => {
      if (!isLoggedIn) return;

      setLoading(true);
      try {
        const response = await fetch('/api/v1/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();
        if (data.status) {
          setUser(data.user);
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchCart = async () => {
      if (!isLoggedIn) return;

      try {
        const response = await fetch('/api/v1/cart', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();
        if (data.status) {
          setCartItems(data.cart);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    fetchCart();

    // Listen for cart updates
    cartChannel.onmessage = () => {
      fetchCart();
    };

    return () => {
      cartChannel.close();
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector('.absolute');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsDropdownOpen(false);
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 left-0 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-gray-800">
            Shop Online
          </Link>

          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Link
                  to="/cart"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Cart {cartItems.length > 0 && `(${cartItems.length})`}
                </Link>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(!isDropdownOpen);
                    }}
                    className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center focus:outline-none hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      userInitials
                    )}
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                        {user?.email}
                      </div>
                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-sm text-gray-500 mb-4">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}