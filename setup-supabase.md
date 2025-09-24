# Supabase Database Setup Instructions

## Prerequisites
1. Create a Supabase account at https://supabase.com/dashboard
2. Install Supabase CLI: `npm install -g supabase`

## Setup Steps

### 1. Create New Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for project to be created (this may take a few minutes)

### 2. Get Project Credentials
1. In your Supabase dashboard, go to "Settings" → "API"
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 3. Configure Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file and replace the placeholder values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Initialize Supabase Locally
1. Login to Supabase CLI:
   ```bash
   supabase login
   ```

2. Link your project (replace YOUR_PROJECT_ID with your actual project ID from the URL):
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

### 5. Apply Database Migrations
Run the following command to create all tables and functions:
```bash
supabase db push
```

This will:
- Create all required tables (sales, employees, debts, etc.)
- Set up all database functions and triggers
- Configure Row Level Security policies
- Initialize the cash balance system

### 6. Verify Setup
1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Check the browser console for any connection errors
3. Try creating a test employee or sale to verify everything works

## Troubleshooting

### Error: "Could not find table in schema cache"
- Make sure you ran `supabase db push` successfully
- Check that your environment variables are correct
- Verify your Supabase project is active and not paused

### Error: "Invalid API key"
- Double-check your `VITE_SUPABASE_ANON_KEY` in the `.env` file
- Make sure you copied the **anon/public** key, not the service role key

### Error: "Failed to fetch"
- Check your internet connection
- Verify the `VITE_SUPABASE_URL` is correct
- Make sure your Supabase project is not paused

### Migration Errors
If you encounter errors during `supabase db push`:
1. Check the migration files in `supabase/migrations/`
2. Try running migrations individually:
   ```bash
   supabase db reset
   supabase db push
   ```

## Next Steps
Once setup is complete:
1. The application will work both online and offline
2. Data will sync automatically when connection is available
3. You can start using all features: sales, employees, cash management, etc.
4. Consider setting up regular backups in your Supabase dashboard

## Support
If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure your Supabase project has the latest migrations applied
4. Try the connection test in the application's debug panel