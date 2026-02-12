import React from 'react';
import { useNavigate } from 'react-router';
import { UtensilsCrossed, ShoppingBag, Star, Clock } from 'lucide-react';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1626200711570-ea66d2226668?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZm9vZCUyMGVsZWdhbnR8ZW58MXx8fHwxNzcwOTc1OTg5fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Luxury Restaurant"
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-amber-600 to-rose-600 mb-8">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-6xl md:text-7xl font-serif mb-6 bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
              Glossy-Gly-Kitchen
            </h1>

            <p className="text-2xl md:text-3xl text-gray-700 mb-8 font-light">
              Experience culinary excellence delivered to your doorstep
            </p>

            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
              Indulge in our carefully curated menu featuring the finest ingredients,
              expertly prepared by our world-class chefs. Every dish is a masterpiece.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/signup')}
                className="px-8 py-4 bg-gradient-to-r from-amber-600 to-rose-600 text-white rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all text-lg font-medium shadow-lg"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-all text-lg font-medium border-2 border-gray-200"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-serif text-center mb-16 bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
            Why Choose Us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-100 to-rose-100 mb-6">
                <Star className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Premium Quality</h3>
              <p className="text-gray-600">
                Only the finest ingredients sourced from trusted suppliers
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-100 to-rose-100 mb-6">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Fast Delivery</h3>
              <p className="text-gray-600">
                Your meals delivered fresh and hot, right on time
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-100 to-rose-100 mb-6">
                <ShoppingBag className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Easy Ordering</h3>
              <p className="text-gray-600">
                Simple and intuitive ordering process for your convenience
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-2xl font-serif mb-4">Glossy-Gly-Kitchen</p>
          <p className="text-purple-200 mb-8">Culinary excellence since 2026</p>
          <div className="flex justify-center gap-6 mb-8">
            <button
              onClick={() => navigate('/login')}
              className="text-purple-300 hover:text-white transition-colors"
            >
              Customer Login
            </button>
            <span className="text-purple-500">•</span>
            <button
              onClick={() => navigate('/admin/login')}
              className="text-purple-300 hover:text-white transition-colors"
            >
              Admin Portal
            </button>
          </div>
          <p className="text-sm text-purple-400">© 2026 All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};
