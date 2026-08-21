import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { type ReactNode, useEffect } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/pages/HomePage';
import { ArticlesPage } from '@/pages/ArticlesPage';
import { ArticlePage } from '@/pages/ArticlePage';
import { CategoryPage } from '@/pages/CategoryPage';
import { AboutPage } from '@/pages/AboutPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ArticleEditorPage } from '@/pages/ArticleEditorPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { ProfileSettingsPage } from '@/pages/settings/ProfileSettingsPage';
import { PasswordSettingsPage } from '@/pages/settings/PasswordSettingsPage';
import { CreatorPage } from '@/pages/CreatorPage';
import { WriterProfilePage } from '@/pages/WriterProfilePage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminPage } from '@/pages/AdminPage';
import { PublicationPage } from '@/pages/PublicationPage';
import { PublicationsPage } from '@/pages/PublicationsPage';
import { PageSpinner } from './components/ui/Skeleton';
import { Toaster } from "sonner";


function AppToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="bottom-right" richColors closeButton />;
}


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children }: Readonly<{ children: ReactNode }>) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <PageSpinner />;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function EditorLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-bg">{children}</div>
  );
}

function AuthLayoutShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
function AdminRoute({ children }: Readonly<{ children: ReactNode }>) {
  const { user, profile, isLoading, isProfileLoading } = useAuth();

  if (isLoading || isProfileLoading) {
    return <PageSpinner />;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
        <Route path="/articles" element={<AppLayout><ArticlesPage /></AppLayout>} />
        <Route path="/articles/:slug" element={<AppLayout><ArticlePage /></AppLayout>} />
        <Route path="/categories/:category" element={<AppLayout><CategoryPage /></AppLayout>} />
        <Route path="/about" element={<AppLayout><AboutPage /></AppLayout>} />
        <Route path="/creator" element={<AppLayout><CreatorPage /></AppLayout>} />
        <Route path="/writers/:username" element={<AppLayout><WriterProfilePage /></AppLayout>} />
        <Route path="/p/:slug" element={<AppLayout> <PublicationPage /> </AppLayout>} />

        {/* Auth routes */}
        <Route path="/login" element={<AuthLayoutShell><LoginPage /></AuthLayoutShell>} />
        <Route path="/signup" element={<AuthLayoutShell><SignupPage /></AuthLayoutShell>} />
        <Route path="/forgot-password" element={<AuthLayoutShell><ForgotPasswordPage /></AuthLayoutShell>} />
        <Route path="/reset-password" element={<AuthLayoutShell><ResetPasswordPage /></AuthLayoutShell>} />

        {/* Dashboard routes */}
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/dashboard/articles/new" element={<ProtectedRoute><EditorLayout><ArticleEditorPage /></EditorLayout></ProtectedRoute>} />
        <Route path="/dashboard/articles/:id/edit" element={<ProtectedRoute><EditorLayout><ArticleEditorPage /></EditorLayout></ProtectedRoute>} />
        <Route path="/dashboard/publications" element={<ProtectedRoute>  <AppLayout> <PublicationsPage />  </AppLayout></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute><AppLayout><SettingsLayout /></AppLayout></ProtectedRoute>}
        >
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfileSettingsPage />} />
          <Route path="password" element={<PasswordSettingsPage />} />

        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><AppLayout><AdminPage /></AppLayout></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<AppLayout><NotFoundPage /></AppLayout>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppToaster />
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
