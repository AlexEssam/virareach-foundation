# Security Setup Instructions

## Critical Actions Required

### 1. Rotate Service Role Key Immediately
- Go to your Supabase dashboard
- Navigate to Settings > API
- Rotate the service role key that was exposed in client-side code
- Update all environment variables with the new key

### 2. Set Environment Variables
Add these to your Supabase Edge Functions environment:

```bash
# Required for all functions
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security settings
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API Keys (never expose these in client code)
OPENAI_API_KEY=your_openai_key
LOVABLE_API_KEY=your_lovable_key
```

### 3. Run Database Migration
Apply the RLS policies:
```bash
supabase db push
```

### 4. Update Client Code
Remove any direct usage of service role keys from client-side code. All admin operations must go through secure Edge Functions.

### 5. Monitor Security Logs
Regularly check the security monitoring endpoint for suspicious activity.

## Security Features Implemented

✅ **Authentication**: All Edge Functions now require valid JWT tokens
✅ **Authorization**: Users can only access their own data via RLS policies
✅ **Input Validation**: All user inputs are validated and sanitized
✅ **Rate Limiting**: Per-user rate limits prevent abuse
✅ **CORS Security**: Restricted to specific origins
✅ **Security Headers**: CSP, X-Frame-Options, etc.
✅ **Error Sanitization**: No sensitive data in error responses
✅ **Audit Logging**: All actions are logged for security monitoring

## Ongoing Security Maintenance

1. **Regularly rotate API keys** (monthly recommended)
2. **Monitor usage logs** for unusual patterns
3. **Review RLS policies** when adding new tables
4. **Keep dependencies updated** to patch vulnerabilities
5. **Implement additional monitoring** as needed