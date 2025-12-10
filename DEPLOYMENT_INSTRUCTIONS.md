# Supabase Edge Functions Deployment Instructions

## Prerequisites

Before deploying, make sure you have:

1. **Supabase CLI installed**:
   ```bash
   npm install -g supabase
   ```

2. **Authenticated with Supabase**:
   ```bash
   supabase login
   ```

3. **Linked to your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

## Deploy the Functions

### Step 1: Deploy Shared Modules First
The shared modules need to be deployed individually:

```bash
# Deploy authentication module
supabase functions deploy _shared/auth --no-verify-jwt

# Deploy CORS module  
supabase functions deploy _shared/cors --no-verify-jwt

# Deploy validation module
supabase functions deploy _shared/validation --no-verify-jwt

# Deploy rate limiting module
supabase functions deploy _shared/rate-limit --no-verify-jwt
```

### Step 2: Deploy Main Functions
Deploy the main functions that use the shared modules:

```bash
# Deploy AI text function
supabase functions deploy ai-text

# Deploy Facebook accounts function
supabase functions deploy facebook-accounts

# Deploy security monitor function
supabase functions deploy admin-security-monitor
```

### Step 3: Set Environment Variables
Set the required environment variables:

```bash
# Set allowed origins (replace with your domain)
supabase secrets set ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Set API keys
supabase secrets set LOVABLE_API_KEY=your_lovable_api_key
```

## Troubleshooting

### If you get "Supabase access token not found":
1. Run `supabase login` to authenticate
2. Run `supabase link --project-ref YOUR_PROJECT_REF` to link to your project
3. Check that your `supabase/config.toml` has the correct project ID

### If functions fail to deploy:
1. Check that all imports use HTTPS URLs
2. Verify that all functions have proper `serve()` calls
3. Make sure there are no circular dependencies

### If authentication fails:
1. Verify that `SUPABASE_SERVICE_ROLE_KEY` is set in your environment
2. Check that the JWT token is being passed correctly
3. Ensure the user is authenticated before calling functions

## Security Features Implemented

✅ **Authentication**: All functions require valid JWT tokens
✅ **Input Validation**: All user inputs are validated and sanitized  
✅ **CORS Security**: Restricted to specific origins
✅ **Security Headers**: CSP, X-Frame-Options, etc.
✅ **Error Handling**: Sanitized error responses
✅ **Rate Limiting**: Per-user request limits

## Testing

After deployment, test the functions:

```bash
# Test AI text function
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-text' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"action": "ai_writer", "topic": "test topic"}'

# Test Facebook accounts function  
curl -X GET 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/facebook-accounts' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

Replace `YOUR_PROJECT_REF` and `YOUR_JWT_TOKEN` with your actual values.