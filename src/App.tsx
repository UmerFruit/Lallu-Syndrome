import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { type ReactNode, useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
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


import { getCategories, getCategoryById, getCategoryBySlug } from '@/services/categoryService';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">{children}</div>
  );
}

function AuthLayoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
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

        {/* Auth routes */}
        <Route path="/login" element={<AuthLayoutShell><LoginPage /></AuthLayoutShell>} />
        <Route path="/signup" element={<AuthLayoutShell><SignupPage /></AuthLayoutShell>} />
        <Route path="/forgot-password" element={<AuthLayoutShell><ForgotPasswordPage /></AuthLayoutShell>} />
        <Route path="/reset-password" element={<AuthLayoutShell><ResetPasswordPage /></AuthLayoutShell>} />

        {/* Dashboard routes */}
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/dashboard/articles/new" element={<ProtectedRoute><EditorLayout><ArticleEditorPage /></EditorLayout></ProtectedRoute>} />
        <Route path="/dashboard/articles/:id/edit" element={<ProtectedRoute><EditorLayout><ArticleEditorPage /></EditorLayout></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
