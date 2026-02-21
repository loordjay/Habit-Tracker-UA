# MERN Habit Tracker Application

A full-stack Habit Tracker application built with MongoDB, Express.js, React.js, and Node.js. Features GitHub-style heatmap visualization, streak tracking, and role-based authentication.

## Features

- **User Authentication**: JWT-based auth with registration and login
- **Habit Management**: Create, update, delete, and track habits
- **GitHub-Style Heatmap**: Visualize daily habit completions over 52 weeks
- **Streak Tracking**: Current streak and longest streak for each habit
- **Admin Dashboard**: Enterprise-style admin panel with global statistics
- **Glassmorphism UI**: Modern dark theme with neon accents

## Prerequisites

- Node.js (v14+)
- MongoDB (local or cloud instance)
- npm or yarn

## Project Structure

```
habit-tracker-mern/
├── backend/
│   ├── models/
│   │   ├── User.js        # User model with roles
│   │   └── Habit.js       # Habit model with heatmap support
│   ├── server.js          # Express server with all API routes
│   ├── package.json
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
└── README.md
```

## Installation & Setup

### 1. Backend Setup

```
bash
cd backend
npm install
```

Update the `.env` file with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/habit-tracker
JWT_SECRET=your-secret-key
PORT=5000
```

Start the backend server:
```
bash
npm start
# or for development
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

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

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Habits
- `GET /api/habits` - Get all user habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/complete` - Mark habit complete
- `POST /api/habits/:id/uncomplete` - Unmark habit completion
- `GET /api/habits/heatmap` - Get heatmap data

### Admin
- `GET /api/admin/stats` - Get global statistics
- `GET /api/admin/users` - Get all users with stats

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

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS with custom glassmorphism effects

## License

MIT
