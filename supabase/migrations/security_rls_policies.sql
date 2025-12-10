-- Enable RLS on all user-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinterest_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapchat_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vk_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Instagram accounts policies
CREATE POLICY "Users can view own instagram accounts" ON instagram_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instagram accounts" ON instagram_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instagram accounts" ON instagram_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instagram accounts" ON instagram_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Facebook accounts policies
CREATE POLICY "Users can view own facebook accounts" ON facebook_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own facebook accounts" ON facebook_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own facebook accounts" ON facebook_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own facebook accounts" ON facebook_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- TikTok accounts policies
CREATE POLICY "Users can view own tiktok accounts" ON tiktok_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tiktok accounts" ON tiktok_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tiktok accounts" ON tiktok_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tiktok accounts" ON tiktok_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Twitter/X accounts policies
CREATE POLICY "Users can view own twitter accounts" ON twitter_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own twitter accounts" ON twitter_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own twitter accounts" ON twitter_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own twitter accounts" ON twitter_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- LinkedIn accounts policies
CREATE POLICY "Users can view own linkedin accounts" ON linkedin_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own linkedin accounts" ON linkedin_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own linkedin accounts" ON linkedin_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own linkedin accounts" ON linkedin_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Pinterest accounts policies
CREATE POLICY "Users can view own pinterest accounts" ON pinterest_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pinterest accounts" ON pinterest_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pinterest accounts" ON pinterest_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pinterest accounts" ON pinterest_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Snapchat accounts policies
CREATE POLICY "Users can view own snapchat accounts" ON snapchat_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapchat accounts" ON snapchat_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snapchat accounts" ON snapchat_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snapchat accounts" ON snapchat_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Reddit accounts policies
CREATE POLICY "Users can view own reddit accounts" ON reddit_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reddit accounts" ON reddit_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reddit accounts" ON reddit_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reddit accounts" ON reddit_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- VK accounts policies
CREATE POLICY "Users can view own vk accounts" ON vk_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vk accounts" ON vk_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vk accounts" ON vk_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vk accounts" ON vk_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- WhatsApp accounts policies
CREATE POLICY "Users can view own whatsapp accounts" ON whatsapp_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whatsapp accounts" ON whatsapp_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own whatsapp accounts" ON whatsapp_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own whatsapp accounts" ON whatsapp_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Telegram accounts policies
CREATE POLICY "Users can view own telegram accounts" ON telegram_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telegram accounts" ON telegram_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram accounts" ON telegram_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own telegram accounts" ON telegram_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Campaigns policies
CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Email campaigns policies
CREATE POLICY "Users can view own email campaigns" ON email_campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email campaigns" ON email_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email campaigns" ON email_campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email campaigns" ON email_campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Scheduled posts policies
CREATE POLICY "Users can view own scheduled posts" ON scheduled_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled posts" ON scheduled_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled posts" ON scheduled_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled posts" ON scheduled_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Usage logs policies (users can only view their own logs)
CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Activity logs policies (users can only view their own logs)
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);