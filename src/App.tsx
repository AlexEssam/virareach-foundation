import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FacebookAccounts from "./pages/facebook/FacebookAccounts";
import FacebookExtractor from "./pages/facebook/FacebookExtractor";
import FacebookPublisher from "./pages/facebook/FacebookPublisher";
import FacebookGroupAnalyzer from "./pages/facebook/FacebookGroupAnalyzer";
import WhatsAppSending from "./pages/whatsapp/WhatsAppSending";
import WhatsAppExtractor from "./pages/whatsapp/WhatsAppExtractor";
import WhatsAppGroups from "./pages/whatsapp/WhatsAppGroups";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/facebook/accounts" element={<FacebookAccounts />} />
            <Route path="/facebook/extractor" element={<FacebookExtractor />} />
            <Route path="/facebook/publisher" element={<FacebookPublisher />} />
            <Route path="/facebook/analyzer" element={<FacebookGroupAnalyzer />} />
            <Route path="/whatsapp/sending" element={<WhatsAppSending />} />
            <Route path="/whatsapp/extractor" element={<WhatsAppExtractor />} />
            <Route path="/whatsapp/groups" element={<WhatsAppGroups />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
