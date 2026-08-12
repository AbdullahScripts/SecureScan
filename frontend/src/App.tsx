import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";       
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";      
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import Landing from "./pages/Home";
import Features from "./pages/Features";
import About from "./pages/About";
import Scan from "./pages/Scan";
import Results from "./pages/Results";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import UrlScanner from "./pages/UrlScanner";
import Assistant from "./pages/Assistant";
import Reports from "./pages/Reports";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import News from "./pages/News";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/features" element={<Features />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />

      {/* Private routes */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/scan" element={
        <PrivateRoute>
          <Scan />
        </PrivateRoute>
      } />
      <Route path="/url-scanner" element={
        <PrivateRoute>
          <UrlScanner />
        </PrivateRoute>
      } />
      <Route path="/assistant" element={
        <PrivateRoute>
          <Assistant />
        </PrivateRoute>
      } />
      <Route path="/reports" element={
        <PrivateRoute>
          <Reports />
        </PrivateRoute>
      } />
      <Route path="/results" element={
        <PrivateRoute>
          <Results />
        </PrivateRoute>
      } />
      <Route path="/history" element={
        <PrivateRoute>
          <History />
        </PrivateRoute>
      } />
      <Route path="/news" element={
        <PrivateRoute>
          <News />
        </PrivateRoute>
      } />
      <Route path="/account" element={
        <PrivateRoute>
          <Account />
        </PrivateRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>        
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
