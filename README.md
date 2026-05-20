# 💬 Convo — Real-Time Messaging Platform

Convo is a high-performance, real-time messaging application built on top of **Next.js 16**, **Socket.io**, and **MongoDB**. Featuring a sleek glassmorphic UI, it facilitates seamless instant communication, typing alerts, read receipts, and user presence management.

![Convo Banner](./public/convo_banner.png)

## 🚀 Key Features

*   **⚡ Real-Time Bidirectional Communication:** Direct integration of Socket.io within the Next.js server context ensures sub-100ms latency for message delivery.
*   **👥 User Online/Offline Presence:** Dynamic visual status updates broadcasted across active client sockets when users connect or disconnect.
*   **✍️ Dynamic Typing Indicators:** Real-time feedback displaying when a conversation participant is actively typing.
*   **✔ Read Receipts:** Automatic status markers confirming when messages are delivered and read by the recipient.
*   **🛡 Secure Cookie-Based Auth:** Robust JWT authentication using HttpOnly, SameSite, and Secure cookies combined with client-side Next.js middleware guards.
*   **📦 Persistent Storage:** Structured MongoDB models (Mongoose) tracking users, active conversation groups, and message histories.
*   **🎨 Glassmorphic Dark UI:** A stunning, premium layout crafted with Tailwind CSS and buttery-smooth micro-animations powered by Framer Motion.
*   **🎛 Centralized State:** Predictable state management with Zustand.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/) |
| **Real-time Gateway** | [Socket.io](https://socket.io/) (Server & Client client-side wrappers) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Database** | [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/) |
| **Styling & Animation** | [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Validation & Forms** | [Zod](https://zod.dev/), [React Hook Form](https://react-hook-form.com/) |
| **Runtime Execution** | [tsx](https://github.com/privatenumber/tsx) (TypeScript execution runner for Node server) |

---

## 📁 Directory Structure

```text
├── public/                 # Static assets (images, logos, favicon)
├── src/
│   ├── app/                # Next.js App Router (pages and API endpoints)
│   │   ├── api/            # API routes (Auth, Users, Messages)
│   │   ├── dashboard/      # Main Chat Dashboard interface
│   │   ├── login/          # User Login page
│   │   ├── register/       # User Registration page
│   │   └── globals.css     # Global styles & Tailwind entry
│   ├── components/
│   │   └── providers/      # App & Socket Context providers
│   ├── db/
│   │   ├── models/         # Mongoose schemas (User, Conversation, Message)
│   │   └── connect.ts      # Database connection pooling
│   ├── store/              # Zustand global states (auth, chat)
│   ├── utils/              # Helper functions (JWT validation, helper methods)
│   └── proxy.ts            # Next.js route protection proxy
├── server.ts               # Custom Node server merging Next.js & Socket.io
├── tsconfig.json           # TypeScript configuration
└── .env                    # Environment variables (git-ignored)
```

---

## ⚡ Getting Started

### 📋 Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [MongoDB Server](https://www.mongodb.com/try/download/community) (running locally or a remote MongoDB Atlas URI)

### 🔧 Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/yourusername/convo.git
    cd convo
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory (you can clone the default configurations):
    ```env
    # Database Connection URI
    MONGODB_URI=mongodb://127.0.0.1:27017/chatapp

    # JWT secret key for signature validation
    JWT_SECRET=chatapp-secret-jwt-key-2026-production-ready

    # Execution Server Configurations
    PORT=3000
    NODE_ENV=development
    ```

### 🏃 Running the Application

*   **Development Mode:**
    Run the custom compiler server to run both Next.js page generation and Socket.io gateway:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) on your browser.

*   **Production Deployment:**
    Build the optimized bundle:
    ```bash
    npm run build
    ```
    Start the custom production server:
    ```bash
    npm start
    ```

---

## 🔌 Socket.io Events Reference

The custom server ([`server.ts`](./server.ts)) communicates with the client ([`SocketProvider.tsx`](./src/components/providers/SocketProvider.tsx)) via the following real-time signals:

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `user:register` | Client ➡️ Server | `{ userId: string }` | Registers socket session mapped to specific user ID |
| `user:status` | Server ➡️ Client | `{ userId: string, isOnline: boolean, lastActive?: Date }` | Broadcasts user online status globally |
| `join:conversation`| Client ➡️ Server | `{ conversationId: string }` | Joins a conversation room channel |
| `leave:conversation`| Client ➡️ Server | `{ conversationId: string }` | Leaves a conversation room channel |
| `typing:start` | Client 🔄 Client | `{ conversationId: string, userId: string }` | Emits active typing state to other room participants |
| `typing:stop` | Client 🔄 Client | `{ conversationId: string, userId: string }` | Resets typing state to other room participants |
| `message:send` | Client ➡️ Server | Message Object (participants, text, senderId) | Routes new messages to active sockets of participants |
| `message:received` | Server ➡️ Client | Message Object | Delivers incoming message in real-time |
| `message:read` | Client 🔄 Client | `{ conversationId: string, userId: string }` | Broadcasts read receipts status updates |
| `disconnect` | Client ➡️ Server | - | Triggers cleanup, deletes mappings, broadcasts offline presence |

---

## 🛡 Security & Best Practices

1.  **HttpOnly JWT Cookies:** Authentication tokens are stored inside secure, client-inaccessible cookies preventing Cross-Site Scripting (XSS) token theft.
2.  **Next.js Route Proxy Protection:** Routes under `/dashboard` are intercepted before rendering. Unauthenticated sessions are instantly redirected to `/login`.
3.  **Strict Data Schemas:** Schema validations implemented on both frontend forms and backend API endpoints using **Zod** models.
4.  **Database Connection Pooling:** Database connection cached globally inside the hot reload server scope to prevent spawning redundant mongoose instances during local development.

---

## 🤝 Contributing

Contributions are welcome! Please read the contribution guidelines or open an issue if you discover bugs or want to request features.

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

