import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Link as LinkIcon, Shield, Download, LogOut } from 'lucide-react';
import type { User as UserType } from '../types';
import { Button } from './ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);

  React.useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    } else if (!['/login', '/register'].includes(location.pathname)) {
      navigate('/login');
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    navigate('/login');
  };

  // Fix: Ensure currentUser?.roles is an array before calling includes
  const isAdmin = Array.isArray(currentUser?.roles) && currentUser.roles.includes('admin');

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, show: true },
    { name: 'Profile', href: '/profile', icon: User, show: true },
    { name: 'Bounty', href: '/links', icon: LinkIcon, show: true },
    { name: 'Admin', href: '/admin', icon: Shield, show: isAdmin },
    { name: 'Downloads', href: '/downloads', icon: Download, show: isAdmin }
  ];

  if (['/login', '/register'].includes(location.pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Modern Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="text-xl font-bold text-blue-600">
                ARMY Bot
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                {navigation.map((item) => {
                  if (!item.show) return null;
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
                        ${isActive
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <div className="flex items-center space-x-2">
                {navigation.map((item) => {
                  if (!item.show) return null;
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        flex flex-col items-center justify-center rounded-md p-2 text-xs
                        ${isActive
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="mt-1">{item.name}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="flex flex-col items-center justify-center rounded-md p-2 text-xs text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="mt-1">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
