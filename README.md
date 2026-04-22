# 🤖 Ultron — Backend

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)

**Real-time AI chat backend powered by Groq (LLaMA 3.1) with FAQ-grounded responses, PostgreSQL persistence, and Socket.IO messaging.**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Server](#running-the-server)
- [API Reference](#-api-reference)
- [Socket Events](#-socket-events)
- [Architecture](#-architecture)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🔍 Overview

The Ultron backend is a real-time AI chat server built with **Express** and **Socket.IO**. It uses **Groq's LLaMA 3.1 8B** model to provide intelligent, context-aware responses grounded in a PostgreSQL FAQ knowledge base. Chat history is persisted per session and automatically cleaned up daily via a cron job.

---

## ✨ Features

- ⚡ **Real-time messaging** via Socket.IO WebSocket connections
- 🧠 **AI-powered responses** using Groq's LLaMA 3.1 8B Instant model
- 📚 **FAQ-grounded answers** — AI uses a structured knowledge base as its primary source of truth
- 🗄️ **Chat persistence** — conversations stored per session in PostgreSQL
- 🔢 **FAQ caching** — in-memory cache with 1-hour TTL to reduce DB queries
- 🔄 **Multi-turn conversation** — last 10 messages of history sent per request
- 🕛 **Daily cleanup cron** — auto-deletes chats and messages every midnight (IST)
- 💡 **Category-based suggestions** — browse FAQ questions by topic
- 🏥 **Keepalive pings** — self-pings every 5 minutes in production to prevent cold starts
- 🔐 **CORS-protected** — restricted origin access via environment config

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js v5 |
| Real-time | Socket.IO v4 |
| Database | PostgreSQL (via `pg` Pool) |
| AI Provider | Groq API (OpenAI-compatible) |
| LLM Model | `llama-3.1-8b-instant` |
| Scheduler | node-cron |
| Dev Server | ts-node-dev |

---

## 📁 Project Structure

```
Ultron_Backend/
├── src/
│   ├── server.ts                 # App entry point — Express + Socket.IO setup
│   ├── config/
│   │   └── db.ts                 # PostgreSQL connection pool
│   ├── routes/
│   │   └── categories.routes.ts  # REST endpoint: GET /api/faqs/categories
│   └── sockets/
│       └── socket.ts             # Socket.IO event handlers + AI logic
├── package.json
├── tsconfig.json
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** database (local or hosted)
- **Groq API key** — get one at [console.groq.com](https://console.groq.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/Ultron_Backend.git
cd Ultron_Backend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ultron_db

# AI
GROK_API_KEY=your_groq_api_key_here

# CORS
FRONTEND_URL=http://localhost:3000

# Production keepalive (only needed in production)
SERVER_URL=https://your-deployed-backend-url.com
```

### Database Setup

Run the following SQL to create the required tables:

```sql
-- FAQ knowledge base
CREATE TABLE faq (
  id        SERIAL PRIMARY KEY,
  question  TEXT    NOT NULL,
  answer    TEXT    NOT NULL,
  category  VARCHAR(100)
);

-- Chat sessions
CREATE TABLE chats (
  id         UUID PRIMARY KEY,
  title      VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE messages (
  id         SERIAL PRIMARY KEY,
  chat_id    UUID REFERENCES chats(id) ON DELETE CASCADE,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Running the Server

```bash
# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Server starts on `http://localhost:5000` by default.

---

## 📡 API Reference

### `GET /`

Health check endpoint.

**Response:**
```
Server Running 🚀
```

---

### `GET /api/faqs/categories`

Returns a list of distinct FAQ categories from the database.

**Response:**
```json
{
  "success": true,
  "data": ["get_started", "about_me", "about_my_creator"]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to fetch categories"
}
```

---

## 🔌 Socket Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `send_message` | `{ msg: string, chatId?: string }` | Send a message to the AI. If `chatId` is omitted, a new chat session is created. |
| `get_suggestions` | `{ category: string }` | Fetch FAQ questions for a given category. |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `receive_message` | `{ chatId: string, question: string, answer: string }` | AI's response to the user's message. |
| `suggestions` | `{ questions: string[] }` | List of FAQ questions matching the requested category. |

---

## 🏗 Architecture

```
Client (Socket.IO)
       │
       ▼
  socket.ts (socketHandler)
       │
       ├── get_suggestions → Query DB → emit "suggestions"
       │
       └── send_message
               │
               ├── Load FAQ context (cached, 1h TTL)
               ├── Load last 10 messages from DB (if chatId exists)
               ├── Call Groq API (LLaMA 3.1 8B) with system prompt + history
               ├── Persist new chat/message to PostgreSQL (transaction)
               └── emit "receive_message"
```

The AI system prompt instructs the model to:
1. Use the FAQ knowledge base as its **primary** source of truth
2. Rewrite answers naturally without copying them verbatim
3. Fall back to general knowledge if no FAQ match exists
4. Maintain a friendly, conversational tone

---

## ☁️ Deployment

This project is designed for platforms like **Render**, **Railway**, or **Fly.io**.

**Important production settings:**

- Set `NODE_ENV=production` in your environment
- Set `SERVER_URL` to your deployed URL to enable keepalive pings (prevents free-tier cold starts)
- Ensure your PostgreSQL instance has SSL enabled (`rejectUnauthorized: false` is pre-configured)

```bash
# Build and start
npm run build && npm start
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

<div align="center">

Made with ❤️ — Ultron Backend

</div>
