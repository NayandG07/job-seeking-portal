'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import { Home, LogOut, User, Briefcase, FileText, Settings, Menu, X } from 'lucide-react';

export default function Header() {
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('You have been signed out successfully.');
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out. Please try again.');
    }
  };

  const getNavigationItems = () => {
    if (!userProfile) return [];

    const items = [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
    ];

    if (userProfile.role === 'student') {
      items.push(
        { href: '/jobs', label: 'Jobs', icon: Briefcase },
        { href: '/applications', label: 'My Applications', icon: FileText },
        { href: '/student/profile', label: 'Profile', icon: User }
      );
    } else if (userProfile.role === 'recruiter') {
      items.push(
        { href: '/recruiter/companies', label: 'Companies', icon: Briefcase },
        { href: '/recruiter/applications', label: 'Applications', icon: FileText }
      );
    } else if (userProfile.role === 'admin') {
      items.push(
        { href: '/admin', label: 'Admin', icon: Settings },
        { href: '/admin/users', label: 'Users', icon: User }
      );
    }

    return items;
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              Job Seeking Portal
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {user && getNavigationItems().map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600 transition-colors text-sm font-medium"
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                {/* Desktop User Info & Logout */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {userProfile?.displayName || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {userProfile?.role || 'student'}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>

                {/* Mobile Sign Out */}
                <button
                  onClick={handleLogout}
                  className="md:hidden flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {user && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {/* User Info */}
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">
                  {userProfile?.displayName || 'User'}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {userProfile?.role || 'student'}
                </div>
              </div>

              {/* Navigation Links */}
              {getNavigationItems().map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}