# Flowva Hub - Rewards Page

A React full-stack application recreating the Rewards page from [Flowvahub.com](https://www.flowvahub.com), built with React and Supabase as part of a technical assessment.

## Project Overview

This project is a recreation of the Rewards page from Flowvahub.com, featuring:
- User authentication and session management
- Points-based rewards system
- Daily streak check-ins
- Notification system
- Responsive, modern UI with proper loading, error, and empty states

## Tech Stack

- **Frontend**: React 18 with Vite
- **Backend & Database**: Supabase (Authentication, Database, Row Level Security)
- **Routing**: React Router DOM
- **Styling**: CSS3 with modern design patterns

**Note**: All authentication, database queries, and API usage are handled directly via Supabase as required.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account (free tier works fine)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd flowva_hub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase Project

1. Create a new project at [supabase.com](https://supabase.com)
2. Wait for the project to be ready (2-3 minutes)
3. Go to **Settings** → **API** and copy:
   - **Project URL**
   - **anon/public key**

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=project-url-here
VITE_SUPABASE_ANON_KEY=anon-key-here
```

**Important**: Replace the placeholder values with your actual Supabase credentials.

### 5. Set Up Database Schema

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Open the `complete-setup.sql` file from this repository
4. Copy and paste the entire SQL script into the SQL Editor
5. Click **Run**

This single SQL script will create:
- All required tables (user_profiles, rewards, user_rewards, daily_checkins, notifications, notification_reads, point_claims)
- Row Level Security (RLS) policies
- Database triggers for automatic profile and notification creation
- Sample rewards data


### 6. Configure Authentication

In your Supabase dashboard:
1. Go to **Authentication** → **Settings**
2. Ensure **Email** authentication is enabled
3. Configure email templates if needed (optional)

### 7. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 8. Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.


## Key Features

### Authentication
- **Supabase Auth Integration**: Full email/password authentication
- **Session Management**: Automatic session persistence and token refresh
- **Protected Routes**: Authentication required for claiming rewards and points
- **User Profile**: Automatic profile creation on sign-up

### Rewards System
- **Browse Rewards**: View all available rewards with points required
- **Claim Rewards**: Deduct points and track claimed rewards
- **Points Display**: Real-time points balance
- **Reward States**: Visual indicators for claimed/unclaimed rewards

### Daily Streak System
- **Daily Check-ins**: Claim 5 points daily
- **Streak Tracking**: Visual calendar showing check-in history
- **Prevent Duplicates**: Cannot claim same day twice

### Notifications
- **Welcome Notification**: Automatic welcome message on sign-up
- **Notification Center**: View all notifications
- **Read/Unread Status**: Track notification read state
- **Mark as Read**: Individual and bulk mark as read

### Points Management
- **Automatic Profile Creation**: User profile created on first login
- **Points Tracking**: Points stored in database with RLS policies
- **Points Updates**: Real-time points updates after actions
- **Point Claims**: Submit tool sign-ups to earn points

### UI/UX Features
- **Loading States**: Proper loading indicators for async operations
- **Error Handling**: User-friendly error messages
- **Empty States**: Helpful messages when no data available
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Modern UI**: Clean, professional design matching Flowvahub.com

## Security Implementation

- **Row Level Security (RLS)**: All tables have RLS enabled
- **Policy-based Access**: Users can only access their own data
- **Secure Authentication**: Supabase handles all auth security
- **Session Validation**: All database queries verify active sessions

## Testing the Application

### Test User Flow

1. **Sign Up**: Create a new account with email and password
2. **Welcome Notification**: Check notifications for welcome message
3. **Daily Points**: Claim daily streak points (5 points per day)
4. **Browse Rewards**: View available rewards
5. **Claim Rewards**: Once you have enough points, claim a reward

### Adding Test Points

To test reward claiming, you can manually add points via SQL:

```sql
-- Get your user ID from auth.users table first
UPDATE user_profiles 
SET points = 10000 
WHERE id = 'user-id-here';
```

Or sign in and use the daily streak feature to earn points.

## Assumptions and Trade-offs

### Assumptions Made

1. **Points System**: 
   - Users start with 0 points
   - Points are earned through daily check-ins (5 points/day) and tool sign-ups (50 points per tool)
   - Points are deducted when claiming rewards

2. **Authentication**:
   - Email/password authentication is sufficient for this assessment
   - Email verification is optional (can be enabled in Supabase settings)
   - Session persistence across page refreshes

3. **Rewards**:
   - All rewards are pre-populated in the database
   - Rewards don't expire
   - No inventory limits on rewards

4. **UI/UX**:
   - Design closely matches Flowvahub.com's existing Rewards page
   - Mobile responsiveness is prioritized
   - Loading states are shown for all async operations

### Trade-offs

1. **Database Queries**:
   - Used direct Supabase queries instead of REST API for better performance and type safety
   - Implemented retry logic for failed queries to handle temporary network issues
   - No pagination implemented (all data loads at once) - acceptable for assessment scope

2. **State Management**:
   - Used React Context for authentication state (simple and effective for this scope)
   - Custom hooks for data fetching (keeps components clean)
   - No global state management library (Redux/Zustand) - not needed for this scope

3. **Error Handling**:
   - User-friendly error messages displayed in UI
   - Console logging for debugging
   - Graceful degradation when operations fail

4. **Real-time Features**:
   - Focused on request-based updates rather than real-time subscriptions
   - Real-time could be added using Supabase subscriptions if needed

5. **Performance**:
   - Optimistic UI updates for better perceived performance
   - Background data refresh after critical operations
   - No code splitting implemented (acceptable for single-page assessment)

## 🎨 Design Decisions

1. **Component Architecture**: 
   - Modular, reusable components
   - Separation of concerns (UI, logic, data)
   - Custom hooks for data fetching logic

2. **Styling Approach**:
   - CSS modules per component for maintainability
   - Consistent design system with reusable patterns
   - Responsive design with mobile-first approach

3. **User Experience**:
   - Immediate feedback for user actions
   - Clear loading and error states
   - Intuitive navigation and interactions

## Notes

- All database operations use Supabase's built-in authentication and RLS policies
- Code is well-commented and follows React best practices
- All features are fully functional and tested

