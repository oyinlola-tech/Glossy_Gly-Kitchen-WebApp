import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingCart, User, Menu, LogOut, UtensilsCrossed, Package, Home } from 'lucide-react';
import { toast } from 'sonner';

export const UserLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const navItems = [
    { path: '/menu', label: 'Menu', icon: UtensilsCrossed },
    { path: '/orders', label: 'Orders', icon: Package },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-amber-100 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate('/menu')}
                className="flex items-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-600 to-rose-600 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-serif bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent hidden sm:block">
                  Glossy-Gly-Kitchen
                </span>
              </button>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white'
                          : 'text-gray-600 hover:bg-amber-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/cart')}
                className="p-2 hover:bg-amber-50 rounded-lg transition-colors relative"
              >
                <ShoppingCart className="w-6 h-6 text-gray-600" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-amber-50 rounded-lg"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>

              {/* Desktop Logout */}
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-amber-100 bg-white">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white'
                        : 'text-gray-600 hover:bg-amber-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-amber-100 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="font-serif text-lg mb-2">Glossy-Gly-Kitchen</p>
            <p className="text-sm">© 2026 All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
};