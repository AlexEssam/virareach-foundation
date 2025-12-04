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
import FacebookMessaging from "./pages/facebook/FacebookMessaging";
import FacebookSocial from "./pages/facebook/FacebookSocial";
import FacebookGroups from "./pages/facebook/FacebookGroups";
import WhatsAppSending from "./pages/whatsapp/WhatsAppSending";
import WhatsAppExtractor from "./pages/whatsapp/WhatsAppExtractor";
import WhatsAppGroups from "./pages/whatsapp/WhatsAppGroups";
import WhatsAppContacts from "./pages/whatsapp/WhatsAppContacts";
import WhatsAppAutoReply from "./pages/whatsapp/WhatsAppAutoReply";
import WhatsAppScheduler from "./pages/whatsapp/WhatsAppScheduler";
import WhatsAppDiscover from "./pages/whatsapp/WhatsAppDiscover";
import WhatsAppAccounts from "./pages/whatsapp/WhatsAppAccounts";
import InstagramAccounts from "./pages/instagram/InstagramAccounts";
import InstagramExtractor from "./pages/instagram/InstagramExtractor";
import InstagramFollow from "./pages/instagram/InstagramFollow";
import InstagramMessaging from "./pages/instagram/InstagramMessaging";
import InstagramAnalytics from "./pages/instagram/InstagramAnalytics";
import InstagramMentions from "./pages/instagram/InstagramMentions";
import XExtractors from "./pages/x/XExtractors";
import XPublishing from "./pages/x/XPublishing";
import XInteractions from "./pages/x/XInteractions";
import XTrends from "./pages/x/XTrends";
import XAccounts from "./pages/x/XAccounts";
import XBookmarks from "./pages/x/XBookmarks";
import XTweetMonitor from "./pages/x/XTweetMonitor";
import XAccountManager from "./pages/x/XAccountManager";
import XPlus from "./pages/x/XPlus";
import TelegramExtractor from "./pages/telegram/TelegramExtractor";
import TelegramSender from "./pages/telegram/TelegramSender";
import TelegramGroups from "./pages/telegram/TelegramGroups";
import LinkedInExtract from "./pages/linkedin/LinkedInExtract";
import LinkedInMessaging from "./pages/linkedin/LinkedInMessaging";
import LinkedInAnalysis from "./pages/linkedin/LinkedInAnalysis";
import EmailCampaigns from "./pages/email/EmailCampaigns";
import EmailTemplates from "./pages/email/EmailTemplates";
import B2BDataCenter from "./pages/b2b/B2BDataCenter";
import TikTokExtractor from "./pages/tiktok/TikTokExtractor";
import TikTokFollow from "./pages/tiktok/TikTokFollow";
import TikTokMessaging from "./pages/tiktok/TikTokMessaging";
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
            <Route path="/facebook/messaging" element={<FacebookMessaging />} />
            <Route path="/facebook/social" element={<FacebookSocial />} />
            <Route path="/facebook/groups" element={<FacebookGroups />} />
            <Route path="/whatsapp/accounts" element={<WhatsAppAccounts />} />
            <Route path="/whatsapp/sending" element={<WhatsAppSending />} />
            <Route path="/whatsapp/extractor" element={<WhatsAppExtractor />} />
            <Route path="/whatsapp/groups" element={<WhatsAppGroups />} />
            <Route path="/whatsapp/contacts" element={<WhatsAppContacts />} />
            <Route path="/whatsapp/autoreply" element={<WhatsAppAutoReply />} />
            <Route path="/whatsapp/scheduler" element={<WhatsAppScheduler />} />
            <Route path="/whatsapp/discover" element={<WhatsAppDiscover />} />
            <Route path="/instagram/accounts" element={<InstagramAccounts />} />
            <Route path="/instagram/extractor" element={<InstagramExtractor />} />
            <Route path="/instagram/follow" element={<InstagramFollow />} />
            <Route path="/instagram/messaging" element={<InstagramMessaging />} />
            <Route path="/instagram/analytics" element={<InstagramAnalytics />} />
            <Route path="/instagram/mentions" element={<InstagramMentions />} />
            <Route path="/x/manager" element={<XAccountManager />} />
            <Route path="/x/extractors" element={<XExtractors />} />
            <Route path="/x/publishing" element={<XPublishing />} />
            <Route path="/x/interactions" element={<XInteractions />} />
            <Route path="/x/trends" element={<XTrends />} />
            <Route path="/x/accounts" element={<XAccounts />} />
            <Route path="/x/bookmarks" element={<XBookmarks />} />
            <Route path="/x/monitor" element={<XTweetMonitor />} />
            <Route path="/x/plus" element={<XPlus />} />
            <Route path="/telegram/extractor" element={<TelegramExtractor />} />
            <Route path="/telegram/sender" element={<TelegramSender />} />
            <Route path="/telegram/groups" element={<TelegramGroups />} />
            <Route path="/linkedin/extract" element={<LinkedInExtract />} />
            <Route path="/linkedin/messaging" element={<LinkedInMessaging />} />
            <Route path="/linkedin/analysis" element={<LinkedInAnalysis />} />
            <Route path="/email/campaigns" element={<EmailCampaigns />} />
            <Route path="/email/templates" element={<EmailTemplates />} />
            <Route path="/b2b/data-center" element={<B2BDataCenter />} />
            <Route path="/tiktok/extractor" element={<TikTokExtractor />} />
            <Route path="/tiktok/follow" element={<TikTokFollow />} />
            <Route path="/tiktok/messaging" element={<TikTokMessaging />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
