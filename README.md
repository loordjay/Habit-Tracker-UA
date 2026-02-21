# MERN Habit Tracker Application

A full-stack Habit Tracker application built with MongoDB, Express.js, React.js, and Node.js. Features GitHub-style heatmap visualization, streak tracking, role-based authentication, and a support ticket system.

## Features

### Core Features
- **User Authentication**: JWT-based auth with registration and login
- **Habit Management**: Create, update, delete, and track habits
- **GitHub-Style Heatmap**: Visualize daily habit completions over 52 weeks
- **Streak Tracking**: Current streak and longest streak for each habit
- **Predefined Habits**: Library of preset habits users can choose from

### Admin Features
- **Admin Dashboard**: Enterprise-style admin panel with global statistics
- **User Management**: View all users with their stats
- **Support Ticket Management**: Handle and resolve user support requests

### User Features
- **Analytics Page**: View personal habit statistics and trends
- **Support Chat**: Submit and manage support tickets
- **Profile Management**: Update user profile with modal interface

### UI/UX
- **Glassmorphism UI**: Modern dark theme with neon accents
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (v14+)
- MongoDB (local or cloud instance)
- npm or yarn

## Project Structure

```
habit-tracker-mern/
├── backend/
│   ├── models/
│   │   ├── User.js            # User model with roles
│   │   ├── Habit.js           # Habit model with heatmap support
│   │   ├── PredefinedHabit.js # Predefined habit templates
│   │   ├── SupportTicket.js   # Support ticket model
│   │   └── SupportMessage.js  # Support message model
│   ├── server.js              # Express server with all API routes
│   ├── server_routes.js       # Route handlers
│   ├── package.json
│   └── .env                   # Environment variables
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Authentication context
│   │   ├── components/
│   │   │   └── ProfileModal.jsx   # Profile modal component
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Login page
│   │   │   ├── Signup.jsx         # Signup page
│   │   │   ├── Dashboard.jsx      # Main dashboard
│   │   │   ├── Habits.jsx         # Habit management page
│   │   │   ├── Analytics.jsx      # Analytics page
│   │   │   ├── AdminDashboard.jsx # Admin dashboard
│   │   │   └── SupportChat.jsx    # Support chat page
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
├── .gitignore
├── README.md
└── package-lock.json
```

## Installation & Setup

### 1. Clone the Repository

```
bash
git clone <repository-url>
cd habit-tracker-mern
```

### 2. Backend Setup

```
bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```
env
MONGODB_URI=mongodb://localhost:27017/habit-tracker
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

Start the backend server:

```
bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```
bash
cd frontend
npm install
```

Start the development server:

```
bash
npm run dev
```

The frontend will run on `http://localhost:5173` (Vite default)

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Habits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/habits` | Get all user habits |
| POST | `/api/habits` | Create new habit |
| PUT | `/api/habits/:id` | Update habit |
| DELETE | `/api/habits/:id` | Delete habit |
| POST | `/api/habits/:id/complete` | Mark habit complete |
| POST | `/api/habits/:id/uncomplete` | Unmark habit completion |
| GET | `/api/habits/heatmap` | Get heatmap data |

### Predefined Habits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/habits/predefined` | Get all predefined habits |

### Support Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/support/tickets` | Get user tickets |
| POST | `/api/support/tickets` | Create new ticket |
| GET | `/api/support/tickets/:id` | Get ticket details |
| PUT | `/api/support/tickets/:id` | Update ticket |
| GET | `/api/support/tickets/:id/messages` | Get ticket messages |
| POST | `/api/support/tickets/:id/messages` | Add message to ticket |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Get global statistics |
| GET | `/api/admin/users` | Get all users with stats |
| GET | `/api/admin/tickets` | Get all support tickets |
| PUT | `/api/admin/tickets/:id` | Update ticket (assign, resolve) |

## User Roles

The application supports two user roles:

- **user**: Regular user with access to habit tracking and personal analytics
- **admin**: Administrator with access to admin dashboard and ticket management

## Creating an Admin User

To create an admin user, you can either:

1. Modify the registration code to set role as 'admin'
2. Or manually update a user's role in MongoDB:

```
javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Technology Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Dotenv** - Environment variables

### Key Libraries
- **nodemon** - Development auto-reload

## Scripts

### Backend
```bash
npm start        # Start production server
npm run dev      # Start development server with auto-reload
```

### Frontend
```
bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Support Ticket Categories

Users can create tickets in the following categories:
- General Inquiry
- Billing
- Technical Issue
- Feature Request
- Bug Report
- Account Issues

Ticket priorities: Low, Medium, High, Urgent
Ticket statuses: Open, Pending, Resolved, Closed

## Heatmap Visualization

The GitHub-style heatmap displays habit completions over the past 52 weeks:
- Each cell represents one day
- Color intensity indicates the number of habits completed
- Green color scheme with varying opacity levels

## License

MIT
