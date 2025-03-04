# 🚀 Chat Application (Dockerized)

A **real-time chat application** built with **Node.js, React, Socket.IO, and Redis**, supporting both **local and Docker deployments**.

## 📦 Tech Stack

- **Frontend**: React, WebSockets
- **Backend**: Node.js, Express, Socket.IO
- **Database**: Redis (for message storage & pub/sub)
- **Containerization**: Docker & Docker Compose

---

## **⚡ Quick Start Guide**

You can run the application in **two ways**:
1️⃣ **Locally (Manual Setup)** – Run each part separately.  
2️⃣ **With Docker** – Use Docker to manage everything.

---

## **🚀 1️⃣ Running Locally (Without Docker)**

### **🔹 Prerequisites**

Ensure you have:

- [Node.js](https://nodejs.org/) (v16+)
- [Redis](https://redis.io/download) (if running without Docker)

### **🛠 Setup Steps**

#### **1️⃣ Clone the Repository**

```bash
git clone https://github.com/bledonibishi/chat-app.git
cd chat-app
```

#### **Start the backend(server)**

```bash
cd server
npm install
npm start

```

#### **Start the frontend(client)**

```bash
cd client
npm install
npm start

```

## **💪 2️⃣ Running with Docker (Fully Containerized Deployment)**

### **🔹 Prerequisites**

Ensure you have:

- Docker installed
- Docker Compose installed

#### **1️⃣ Clone the Repository**

```bash
git clone https://github.com/bledonibishi/chat-app.git
cd chat-app
```

#### **2️⃣ Start the Application with Docker Compose**

```bash
docker-compose up --build -d
```
