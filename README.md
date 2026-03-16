# DevLink — Developer Portfolio Builder

> Build a developer brand that feels alive. Clean, sharp, and ready to share.

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

**Live Demo →** [devlink-viiiiiimmv.vercel.app](https://devlink-viiiiiimmv.vercel.app)

---

## About

DevLink is a full-stack developer portfolio builder that lets developers create a personalized, public-facing portfolio page shareable via a custom URL. It also includes a discovery feed for finding other developers and a collaborative idea board called **SparkForge**.

Whether you're looking for freelance opportunities, building in public, or finding collaborators for your next project — DevLink brings it all into one place.

---

## Features

### Portfolio Builder
- Create a public developer profile with a **custom URL** (e.g., `/yourname`)
- Showcase skills, bio, and availability status
- Multiple **portfolio themes** (`editorial`, `bento`) and **color schemes** (`modern`, `lavender`)
- **QR code generation** for instant mobile sharing
- One-click sharing to LinkedIn, X (Twitter), WhatsApp, and Email

### Discover
- Browse published developer portfolios across the platform
- Search by name, username, bio, or skills
- Explore developer profiles with tech stack and theme preferences

### SparkForge
- Post project ideas and find developers to build with
- Discover what others are building — search by concept, stack, or tag
- Send **sparks** to connect, then move to chat or direct contact

### Inbox
- Centralized inbox for outreach and replies
- Track new inquiries, pulse messages, and connection requests
- Live stats: profile views, new inquiries, unread pulses

### Dark / Light Mode
- Built-in theme toggle across all pages

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | MongoDB + Mongoose |
| Auth | NextAuth.js |
| Media | Cloudinary |
| Deployment | Vercel |
| QR Code | goqr.me API |

---

## Project Structure

```
devlink/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and DB connection
├── models/           # Mongoose schema definitions
├── pages/api/        # API route handlers
├── scripts/          # Utility scripts
├── types/            # TypeScript type definitions
└── middleware.ts     # Auth and route protection middleware
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB URI (local or Atlas)
- Cloudinary account
- NextAuth secret

### Installation

```bash
# Clone the repository
git clone https://github.com/viiiiiimmv/devlink.git
cd devlink

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file in the root with the following:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

This project is deployed on **Vercel**. To deploy your own instance:

1. Fork this repository
2. Connect to Vercel via [vercel.com](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Deploy

---

## Author

**Shiv Chauhan**

[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=flat-square&logo=vercel&logoColor=white)](https://shivchauhan835.netlify.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/shivchauhan)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/viiiiiimmv)

---

## License

This project is private and proprietary. All rights reserved © 2026.
