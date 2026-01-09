# Local Development Setup Guide

This guide explains how to set up and run the project locally, including edge functions and third-party integrations.

## Prerequisites

1. **Node.js** (v18+)
2. **Supabase CLI** - Install via:
   ```bash
   npm install -g supabase
   ```
3. **Deno** (for edge functions) - Install via:
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-folder>

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<your-local-anon-key>
```

### 3. Start Supabase Locally

```bash
# Start Supabase services
supabase start

# This will output your local credentials:
# - API URL: http://localhost:54321
# - anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Edge Functions Setup

Create `supabase/functions/.env` file:

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<your-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>
RESEND_API_KEY=<your-resend-api-key>
```

### 5. Run Edge Functions Locally

```bash
# Serve all edge functions
supabase functions serve --env-file supabase/functions/.env
```

### 6. Start the Frontend

```bash
npm run dev
```

## Third-Party Email Integration (Resend)

The invite user functionality uses [Resend](https://resend.com) for sending emails.

### Setup Steps

1. **Create Account**: Go to [resend.com](https://resend.com) and sign up

2. **Verify Domain** (for production):
   - Navigate to [resend.com/domains](https://resend.com/domains)
   - Add and verify your domain

3. **Create API Key**:
   - Go to [resend.com/api-keys](https://resend.com/api-keys)
   - Create a new API key
   - Add it to `supabase/functions/.env` as `RESEND_API_KEY`

4. **Development Note**:
   - For development, you can use the test domain `onboarding@resend.dev`
   - This only sends to the email address associated with your Resend account

## Edge Functions Overview

| Function | Purpose |
|----------|---------|
| `invite-user` | Creates new user accounts and sends invitations |
| `send-credentials` | Sends login credentials via email/WhatsApp |
| `delete-user` | Removes user accounts |
| `attendance-punch` | Handles attendance punch API |
| `reset-company-data` | Resets company data (admin only) |

## Troubleshooting

### "Failed to send request to edge function"

1. **Check if edge functions are running**:
   ```bash
   supabase functions serve --env-file supabase/functions/.env
   ```

2. **Verify environment variables** in `supabase/functions/.env`

3. **Check CORS**: The CORS configuration includes localhost origins by default

### "User already exists" Error

- Check if the email is already registered in the auth.users table
- Use Supabase Studio at `http://localhost:54323` to inspect data

### Email Not Sending

1. Verify `RESEND_API_KEY` is set correctly
2. Check Resend dashboard for delivery logs
3. In development, emails only send to your Resend account email

## Database Migrations

```bash
# Apply migrations
supabase db reset

# Create new migration
supabase migration new <migration-name>
```

## Useful Commands

```bash
# View Supabase status
supabase status

# View edge function logs
supabase functions logs <function-name>

# Stop Supabase
supabase stop

# Reset database
supabase db reset
```

## Architecture

```
├── src/
│   ├── pages/admin/UserManagementPage.tsx  # User management UI
│   └── lib/validations.ts                   # Form validation schemas
├── supabase/
│   ├── functions/
│   │   ├── _shared/cors.ts                  # Shared CORS config
│   │   ├── invite-user/index.ts             # User invitation logic
│   │   ├── send-credentials/index.ts        # Credential sharing
│   │   └── delete-user/index.ts             # User deletion
│   └── config.toml                          # Supabase configuration
```
