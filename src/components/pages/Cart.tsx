import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CartItem {
  foodId: string;
  quantity: number;
  food: {
    id: string;
    name: string;
    price: number;
    description?: string;
  };
}

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [cart, setCart] = useState<{ items: CartItem[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.getCart(token);
      setCart(response);
    } catch (error: any) {
      toast.error('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (foodId: string, newQuantity: number) => {
    if (!token) return;

    if (newQuantity < 1) {
      handleRemoveItem(foodId);
      return;
    }

    setUpdatingItem(foodId);
    try {
      await apiService.updateCart(token, { foodId, quantity: newQuantity });
      await loadCart();
    } catch (error: any) {
      toast.error('Failed to update cart');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (foodId: string) => {
    if (!token) return;

    setUpdatingItem(foodId);
    try {
      await apiService.updateCart(token, { foodId, quantity: 0 });
      await loadCart();
      toast.success('Item removed from cart');
    } catch (error: any) {
      toast.error('Failed to remove item');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleClearCart = async () => {
    if (!token) return;

    try {
      await apiService.clearCart(token);
      await loadCart();
      toast.success('Cart cleared');
    } catch (error: any) {
      toast.error('Failed to clear cart');
    }
  };

  const handleCheckout = async () => {
    if (!token) return;

    try {
      const order = await apiService.createOrder(token);
      toast.success('Order created!');
      navigate(`/checkout/${order.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.food.price * item.quantity, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-amber-100 to-rose-100 flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-amber-600" />
        </div>
        <h2 className="text-3xl font-serif mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">
          Discover our exquisite menu and add some delicious items
        </p>
        <button
          onClick={() => navigate('/menu')}
          className="bg-gradient-to-r from-amber-600 to-rose-600 text-white px-8 py-3 rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-serif bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
          Shopping Cart
        </h1>
        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-rose-600 hover:text-rose-700 text-sm font-medium"
          >
            Clear Cart
          </button>
        )}
      </div>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div
            key={item.foodId}
            className="bg-white rounded-2xl p-6 shadow-lg flex items-center gap-6"
          >
            <div className="flex-1">
              <h3 className="text-xl font-serif mb-1">{item.food.name}</h3>
              {item.food.description && (
                <p className="text-gray-600 text-sm mb-2">{item.food.description}</p>
              )}
              <p className="text-amber-600 font-semibold">${item.food.price.toFixed(2)}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2">
                <button
                  onClick={() => updateQuantity(item.foodId, item.quantity - 1)}
                  disabled={updatingItem === item.foodId}
                  className="p-1 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-medium w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.foodId, item.quantity + 1)}
                  disabled={updatingItem === item.foodId}
                  className="p-1 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleRemoveItem(item.foodId)}
                disabled={updatingItem === item.foodId}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax (estimated)</span>
            <span>${(calculateTotal() * 0.1).toFixed(2)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-xl font-semibold">
            <span>Total</span>
            <span className="text-amber-600">${(calculateTotal() * 1.1).toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          className="w-full bg-gradient-to-r from-amber-600 to-rose-600 text-white py-4 rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all font-medium text-lg"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};