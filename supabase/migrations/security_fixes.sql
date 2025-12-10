-- Enable Row Level Security on all user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinterest_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapchat_campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for points
CREATE POLICY "Users can view own points" ON points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points" ON points
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points" ON points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for points_transactions
CREATE POLICY "Users can view own transactions" ON points_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON points_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for email_campaigns
CREATE POLICY "Users can view own email campaigns" ON email_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email campaigns" ON email_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email campaigns" ON email_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email campaigns" ON email_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for email_templates
CREATE POLICY "Users can view own email templates" ON email_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email templates" ON email_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email templates" ON email_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email templates" ON email_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for instagram_accounts
CREATE POLICY "Users can view own instagram accounts" ON instagram_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instagram accounts" ON instagram_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instagram accounts" ON instagram_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instagram accounts" ON instagram_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for instagram_campaigns
CREATE POLICY "Users can view own instagram campaigns" ON instagram_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instagram campaigns" ON instagram_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instagram campaigns" ON instagram_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instagram campaigns" ON instagram_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for linkedin_campaigns
CREATE POLICY "Users can view own linkedin campaigns" ON linkedin_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own linkedin campaigns" ON linkedin_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own linkedin campaigns" ON linkedin_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own linkedin campaigns" ON linkedin_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for pinterest_campaigns
CREATE POLICY "Users can view own pinterest campaigns" ON pinterest_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pinterest campaigns" ON pinterest_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pinterest campaigns" ON pinterest_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pinterest campaigns" ON pinterest_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for snapchat_campaigns
CREATE POLICY "Users can view own snapchat campaigns" ON snapchat_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapchat campaigns" ON snapchat_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snapchat campaigns" ON snapchat_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snapchat campaigns" ON snapchat_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Add user_settings table for persisting settings
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email_notifications BOOLEAN DEFAULT true,
    campaign_alerts BOOLEAN DEFAULT true,
    weekly_reports BOOLEAN DEFAULT false,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    dark_mode BOOLEAN DEFAULT true,
    auto_backup BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Add rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint, window_start)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits" ON rate_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rate limits" ON rate_limits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rate limits" ON rate_limits
    FOR UPDATE USING (auth.uid() = user_id);

-- Add audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_settings
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();