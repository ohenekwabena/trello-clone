<h1 align="center">🎯 Trello Clone - Project Management Made Simple</h1>

<p align="center">
  A full-featured project management application inspired by Trello, built with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#database-setup"><strong>Database Setup</strong></a> ·
  <a href="#project-structure"><strong>Project Structure</strong></a>
</p>

<br/>

## 📋 Overview

This is a modern, feature-rich Trello clone that enables teams to organize projects, track tasks, and collaborate effectively. Built with cutting-edge technologies, it provides a seamless user experience with real-time updates, drag-and-drop functionality, and comprehensive project analytics.

## ✨ Features

### 🔐 Authentication & User Management
- Email/password authentication with Supabase Auth
- Password reset and email verification
- Secure session management with cookies
- Protected routes and role-based access

### 🏢 Organization Management
- Create and manage multiple organizations
- Role-based permissions (Owner, Admin, Member)
- Invite members via email with secure time-limited tokens
- Automatic role assignment and access control
- View organization members and manage permissions

### 📊 Board & Task Management
- Create unlimited boards within organizations
- Drag-and-drop lists and cards
- Card details with descriptions and due dates
- Activity tracking and audit logs
- Move cards between lists seamlessly

### 📈 Dashboard & Analytics
- Real-time project overview
- Board activity charts and statistics
- Overdue cards tracking
- Team collaboration metrics
- Activity timeline and due date calendar
- Performance trends and insights

### 🎨 Modern UI/UX
- Beautiful, responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Dark mode support
- Accessible components with shadcn/ui
- Toast notifications for user feedback
- Loading states and error handling

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org) (App Router)
- **Language:** TypeScript
- **Database:** [Supabase](https://supabase.com) (PostgreSQL)
- **Authentication:** Supabase Auth with SSR
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **Components:** [shadcn/ui](https://ui.shadcn.com)
- **Drag & Drop:** [@dnd-kit](https://dndkit.com)
- **Charts:** [Recharts](https://recharts.org)
- **Animations:** [Framer Motion](https://www.framer.com/motion)
- **Email:** [Resend](https://resend.com)
- **Icons:** [Lucide React](https://lucide.dev) & [Tabler Icons](https://tabler.io/icons)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- A Supabase account ([create one here](https://database.new))
- A Resend account for email functionality ([sign up here](https://resend.com))

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/trello-clone.git
cd trello-clone
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Where to find these values:**

- **Supabase credentials:** Go to your [Supabase Dashboard](https://supabase.com/dashboard) → Select your project → Settings → API
  - `NEXT_PUBLIC_SUPABASE_URL` is the "Project URL"
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the "anon/public" key
  - `SUPABASE_SERVICE_ROLE_KEY` is the "service_role" key (keep this secret!)

- **Resend API key:** Go to [Resend Dashboard](https://resend.com/api-keys) → Create API Key

### 4. Set Up the Database

Run the database migrations in your Supabase SQL Editor (in order):

```sql
-- Navigate to: Supabase Dashboard → SQL Editor → New Query

-- Run each migration file in sequence:
-- 1. Organizations and members
-- Copy/paste from: supabase/migrations/20231121000000_create_organizations.sql

-- 2. Invitation system
-- Copy/paste from: supabase/migrations/20231121000001_create_invites.sql

-- 3. Boards
-- Copy/paste from: supabase/migrations/20231121000002_create_boards.sql

-- 4. Lists
-- Copy/paste from: supabase/migrations/20231121000003_create_lists.sql

-- 5. Cards
-- Copy/paste from: supabase/migrations/20231121000004_create_cards.sql

-- 6. Card activities
-- Copy/paste from: supabase/migrations/20231121000005_create_card_activities.sql

-- 7. Bug fixes (latest)
-- Copy/paste from: supabase/migrations/20241122000001_fix_accept_invite_ambiguity.sql
-- Copy/paste from: supabase/migrations/20241122000002_fix_invite_user_references.sql
```

Alternatively, if you have the Supabase CLI installed:

```bash
# Link your project
supabase link --project-ref your_project_ref

# Push migrations
supabase db push
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
trello-clone/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── send-invite/          # Email invitation endpoint
│   ├── auth/                     # Authentication pages
│   │   ├── login/                # Sign in page
│   │   ├── sign-up/              # Sign up page
│   │   ├── forgot-password/      # Password reset
│   │   └── ...                   # Other auth flows
│   ├── invite/                   # Invitation acceptance
│   │   └── [token]/              # Dynamic invite token route
│   ├── protected/                # Protected routes (authenticated)
│   │   ├── dashboard/            # Main dashboard with analytics
│   │   ├── organizations/        # Organization management
│   │   │   ├── page.tsx          # Organizations list
│   │   │   └── [id]/             # Single organization view
│   │   └── profile/              # User profile
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── boards/                   # Board-related components
│   │   ├── board-list.tsx        # Display boards
│   │   ├── card-item.tsx         # Individual card
│   │   ├── draggable-card.tsx    # Drag-and-drop card
│   │   └── draggable-list.tsx    # Drag-and-drop list
│   ├── dashboard/                # Dashboard components
│   │   ├── overview-stats.tsx    # Statistics cards
│   │   ├── board-activity-chart.tsx
│   │   ├── due-date-calendar.tsx
│   │   └── ...
│   ├── organizations/            # Organization components
│   │   ├── invite-members-modal.tsx
│   │   ├── pending-invites-list.tsx
│   │   ├── members-list.tsx
│   │   └── ...
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
│
├── lib/                          # Utility functions and actions
│   ├── actions/                  # Server actions
│   │   ├── organizations.ts      # Organization CRUD
│   │   ├── invites.ts           # Invitation system
│   │   ├── boards.ts            # Board management
│   │   ├── cards.ts             # Card operations
│   │   ├── dashboard.ts         # Dashboard data
│   │   └── ...
│   ├── supabase/                # Supabase clients
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Middleware client
│   ├── types/                   # TypeScript types
│   │   ├── organization.ts
│   │   ├── board.ts
│   │   └── ...
│   └── utils.ts                 # Utility functions
│
├── supabase/                    # Supabase configuration
│   └── migrations/              # Database migrations
│       ├── 20231121000000_create_organizations.sql
│       ├── 20231121000001_create_invites.sql
│       ├── 20231121000002_create_boards.sql
│       └── ...
│
├── .env.local                   # Environment variables (create this)
├── components.json              # shadcn/ui config
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies
├── tailwind.config.ts           # Tailwind CSS config
└── tsconfig.json               # TypeScript config
```

## 🗄️ Database Schema

### Core Tables

- **`organizations`** - Teams/workspaces
- **`organization_members`** - User memberships with roles
- **`organization_invites`** - Email invitations with tokens
- **`boards`** - Project boards
- **`lists`** - Columns within boards
- **`cards`** - Tasks/items within lists
- **`card_activities`** - Activity logs for cards

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access data they have permission to view
- Role-based access control (Owner, Admin, Member)
- Secure token-based invitations with expiration

## 🎯 Key Features Walkthrough

### 1. Create an Organization

1. Sign up or log in to your account
2. Navigate to **Organizations** from the dashboard
3. Click **Create Organization**
4. Enter organization name and description
5. You're automatically assigned as the Owner

### 2. Invite Team Members

1. Go to your organization page
2. Click **Invite Members**
3. Enter email address and select role (Admin or Member)
4. Invitee receives an email with a secure link
5. Link expires in 7 days
6. Track pending invites and resend if needed

### 3. Create Boards and Cards

1. Within an organization, click **Create Board**
2. Add lists (columns) to organize tasks
3. Create cards within lists
4. Drag and drop cards between lists
5. Click on cards to add details, due dates, and descriptions

### 4. Monitor Progress

1. Visit the **Dashboard** for an overview
2. View statistics: total cards, overdue items, completed tasks
3. Check board activity charts
4. See upcoming due dates in the calendar
5. Review recent activities across all boards

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel project settings
4. Deploy!

### Environment Variables for Production

Make sure to set these in your hosting platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_SITE_URL` (your production URL)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [Supabase](https://supabase.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Inspired by [Trello](https://trello.com)

---

<p align="center">Made with ❤️ for better project management</p>
