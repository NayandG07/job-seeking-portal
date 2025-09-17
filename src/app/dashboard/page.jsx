'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { useRouter } from 'next/navigation';
import Layout from '../../components/common/Layout.jsx';
import { FullPageLoader } from '../../components/common/LoadingSpinner.jsx';
import Button from '../../components/common/Button.jsx';
import Alert from '../../components/common/Alert.jsx';
import { User, Briefcase, FileText, Building2, BarChart3, Mail } from 'lucide-react';

export default function DashboardPage() {
  const { user, userProfile, loading, sendVerificationEmail } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [sendingVerification, setSendingVerification] = React.useState(false);

  // Redirect to auth if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return <FullPageLoader message="Loading dashboard..." />;
  }

  if (!user || !userProfile) {
    return <FullPageLoader message="Setting up your profile..." />;
  }

  const handleSendVerification = async () => {
    setSendingVerification(true);
    try {
      await sendVerificationEmail();
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setSendingVerification(false);
    }
  };

  const getDashboardCards = () => {
    const cards = [];

    if (userProfile.role === 'student') {
      cards.push(
        {
          title: 'My Profile',
          description: 'Manage your profile information and upload your resume to attract employers.',
          icon: User,
          action: () => router.push('/student/profile'),
          buttonText: 'Edit Profile',
          color: 'indigo'
        },
        {
          title: 'Browse Jobs',
          description: 'Discover exciting job opportunities that match your skills and interests.',
          icon: Briefcase,
          action: () => router.push('/jobs'),
          buttonText: 'Browse Jobs',
          color: 'green'
        },
        {
          title: 'My Applications',
          description: 'Track the status of your job applications and manage your submissions.',
          icon: FileText,
          action: () => router.push('/applications'),
          buttonText: 'View Applications',
          color: 'purple'
        }
      );
    } else if (userProfile.role === 'recruiter') {
      cards.push(
        {
          title: 'Company Management',
          description: 'Manage your company profile and showcase your organization to candidates.',
          icon: Building2,
          action: () => router.push('/recruiter/companies'),
          buttonText: 'Manage Company',
          color: 'indigo'
        },
        {
          title: 'Job Postings',
          description: 'Create and manage job postings to attract the best talent.',
          icon: Briefcase,
          action: () => router.push('/recruiter/jobs'),
          buttonText: 'Manage Jobs',
          color: 'green'
        },
        {
          title: 'Applications',
          description: 'Review and manage applications from potential candidates.',
          icon: FileText,
          action: () => router.push('/recruiter/applications'),
          buttonText: 'Review Applications',
          color: 'purple'
        }
      );
    } else if (userProfile.role === 'admin') {
      cards.push(
        {
          title: 'User Management',
          description: 'Manage user accounts, roles, and permissions across the platform.',
          icon: User,
          action: () => router.push('/admin/users'),
          buttonText: 'Manage Users',
          color: 'indigo'
        },
        {
          title: 'Platform Analytics',
          description: 'View platform statistics, usage metrics, and performance data.',
          icon: BarChart3,
          action: () => router.push('/admin'),
          buttonText: 'View Analytics',
          color: 'green'
        }
      );
    }

    return cards;
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Email Verification Alert */}
          {user && !user.emailVerified && (
            <div className="mb-6">
              <Alert variant="warning">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-orange-500 mr-2" />
                    <div>
                      <p className="font-medium">Email verification required</p>
                      <p className="text-sm">Please verify your email address to access all features.</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendVerification}
                    loading={sendingVerification}
                    disabled={sendingVerification}
                    variant="outline"
                    size="sm"
                  >
                    {sendingVerification ? 'Sending...' : 'Resend Email'}
                  </Button>
                </div>
              </Alert>
            </div>
          )}

          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userProfile.displayName}!
            </h1>
            <p className="mt-2 text-gray-600">
              {userProfile.role === 'student' && "Ready to find your next opportunity?"}
              {userProfile.role === 'recruiter' && "Ready to find great talent?"}
              {userProfile.role === 'admin' && "Manage your platform efficiently."}
            </p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {getDashboardCards().map((card) => {
              const Icon = card.icon;
              const colorClasses = {
                indigo: 'from-indigo-500 to-indigo-600',
                green: 'from-green-500 to-green-600',
                purple: 'from-purple-500 to-purple-600',
              };

              return (
                <div
                  key={card.title}
                  className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow"
                >
                  <div className={`p-6 bg-gradient-to-r ${colorClasses[card.color]}`}>
                    <div className="flex items-center">
                      <Icon className="h-8 w-8 text-white" />
                      <h3 className="ml-3 text-lg font-medium text-white">
                        {card.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-4">
                      {card.description}
                    </p>
                    <Button
                      onClick={card.action}
                      variant={card.color === 'indigo' ? 'primary' : card.color === 'green' ? 'success' : 'secondary'}
                      className="w-full"
                    >
                      {card.buttonText}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}