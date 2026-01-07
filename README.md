# MyYouthInfo Backend

Express.js backend API for the MyYouthInfo youth information portal.

## Features

- 🔐 **Authentication** - JWT-based user authentication
- 👥 **User Management** - User profiles and role management
- 📝 **Opportunities** - CRUD for bursaries, careers, learnerships
- 🤖 **AI Chat** - OpenAI-powered career assistant
- 📄 **CV Upload** - File upload with Multer
- 📧 **Email** - Password reset and notifications
- 🗣️ **Forums** - Community discussion boards

## Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- OpenAI API
- Nodemailer

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database (MongoDB Atlas recommended)
- OpenAI API key (for AI features)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your configuration
# See Environment Variables section below

# Start development server
npm run dev

# Or start production server
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/opportunities` | Get all opportunities |
| POST | `/api/chat` | AI career chat |
| GET | `/api/forum` | Get forum posts |

## Deployment on Vercel

1. Push this repository to GitHub
2. Import the project in Vercel
3. Set all environment variables in Vercel dashboard
4. Deploy!

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `EMAIL_USER` | Gmail address for emails | Yes |
| `EMAIL_PASS` | Gmail app password | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |

## License

© 2025 MyYouthInfo. All rights reserved.
