import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { ShoppingCart, Plus, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Food {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export const Menu: React.FC = () => {
  const { token } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const response = await apiService.getFoods();
      setFoods(response);
    } catch (error: any) {
      toast.error('Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (foodId: string) => {
    if (!token) {
      toast.error('Please login to add items to cart');
      return;
    }

    setAddingToCart(foodId);
    try {
      await apiService.addToCart(token, { foodId, quantity: 1 });
      toast.success('Added to cart!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const categories = ['all', ...new Set(foods.map((f) => f.category).filter(Boolean))];

  const filteredFoods = foods.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         food.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Placeholder images for food items
  const placeholderImages = {
    'burger': 'https://images.unsplash.com/photo-1606755456206-b25206cde27e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJnZXIlMjBmcmllcyUyMGFwcGV0aXplcnxlbnwxfHx8fDE3NzA5NzYwNTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'pasta': 'https://images.unsplash.com/photo-1609166639722-47053ca112ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGl0YWxpYW4lMjBjdWlzaW5lfGVufDF8fHx8MTc3MDg4MDA5NXww&ixlib=rb-4.1.0&q=80&w=1080',
    'sushi': 'https://images.unsplash.com/photo-1700324822763-956100f79b0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMGphcGFuZXNlJTIwZm9vZHxlbnwxfHx8fDE3NzA5MDMyNzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'steak': 'https://images.unsplash.com/photo-1693422660544-014dd9f3ef73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGVhayUyMGdyaWxsZWQlMjBtZWF0fGVufDF8fHx8MTc3MDkzOTgxMnww&ixlib=rb-4.1.0&q=80&w=1080',
    'salad': 'https://images.unsplash.com/photo-1677653805080-59c57727c84e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxhZCUyMGZyZXNoJTIwdmVnZXRhYmxlc3xlbnwxfHx8fDE3NzA5NzYwNTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'default': 'https://images.unsplash.com/photo-1765009557798-da2bded84958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwbWVudSUyMGZvb2QlMjB2YXJpZXR5fGVufDF8fHx8MTc3MDk3NjA1NHww&ixlib=rb-4.1.0&q=80&w=1080',
  };

  const getImageForFood = (food: Food) => {
    if (food.imageUrl) return food.imageUrl;
    const categoryKey = Object.keys(placeholderImages).find(key => 
      food.name.toLowerCase().includes(key) || food.category?.toLowerCase().includes(key)
    );
    return placeholderImages[categoryKey as keyof typeof placeholderImages] || placeholderImages.default;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading our exquisite menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-serif mb-4 bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
          Our Menu
        </h1>
        <p className="text-xl text-gray-600">
          Discover culinary masterpieces crafted with passion
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search dishes..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-xl font-medium capitalize transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-amber-50 border-2 border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Food Grid */}
      {filteredFoods.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 text-lg">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFoods.map((food) => (
            <div
              key={food.id}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group"
            >
              <div className="relative h-56 overflow-hidden">
                <ImageWithFallback
                  src={getImageForFood(food)}
                  alt={food.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-amber-600 font-semibold">
                    ${food.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-3">
                  {food.category && (
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-100 to-rose-100 text-amber-700 text-xs font-medium rounded-full mb-2">
                      {food.category}
                    </span>
                  )}
                  <h3 className="text-xl font-serif mb-2">{food.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {food.description || 'A delicious culinary creation'}
                  </p>
                </div>

                <button
                  onClick={() => handleAddToCart(food.id)}
                  disabled={addingToCart === food.id}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-rose-600 text-white py-3 rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addingToCart === food.id ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};