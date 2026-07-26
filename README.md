# 🧺 Ocupado — Real-Time Laundry Queue Management System

> A real-time system that ends the daily scramble for hostel washing machines. Students join one fair queue and get allocated machines automatically, powered by an async BullMQ + Redis job queue that handles sequential allocation, timed confirmations, and fallbacks, with live updates over Socket.io.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-FF4500?style=for-the-badge)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 🔗 Live Demo

**Try it here → [ocupado.vercel.app](https://ocupado.vercel.app)**

Registration is **admin-only by design**, so use the demo student account below to log in and explore:

| Email | Password |
|-------|----------|
| `student1@gmail.com` | `student1` |

> ⏳ The backend runs on a free tier and may take **~30 seconds to wake up** on the very first request if it's been idle. After that, everything is instant.
>
> ℹ️ This is a shared live demo, so machine data may look different depending on what other visitors are doing.

---

## 📌 The Problem

Every hostel in India has the same one. Washing machines sit on the top floor, so students make repeated wasted trips just to check if a machine is free, and there's no queue, it's whoever shows up first. During peak hours it turns into chaos.

**Ocupado** fixes this with a single fair queue for all machines, sequential machine allocation, and live status that updates the instant anything changes.

---

## ✨ Key Features

- **Fair global queue:** one first-come-first-served line for all machines, not a separate queue per machine
- **Sequential allocation:** when a machine frees up, it's offered to the next eligible student automatically
- **Timed confirmation windows:** an offer must be confirmed within a set window, then started within another; miss either and it cascades to the next person
- **Real-time status:** machine state broadcasts live via Socket.io, no page refresh needed
- **Auto-releasing timers:** pick 30/45/60 min and the machine frees itself when the cycle ends
- **Role-based access:** separate student and admin capabilities, enforced on the backend
- **Admin panel:** create machines, register students, toggle maintenance

---

## 🏗️ Architecture

Four independent services, each chosen for what that part of the app actually needs:

| Layer | Tech | Hosted on |
|-------|------|-----------|
| **Frontend** | React + Vite + Tailwind | Vercel |
| **Backend + queue worker** | Express + Socket.io + BullMQ | Render |
| **Database** | PostgreSQL | Neon |
| **Queue store** | Redis (over TLS) | Upstash |

**How the queue works:** a single global waitlist feeds every machine. When a machine frees up, a background job walks the queue, finds the first *eligible* student (skipping anyone already holding two machines or with a pending offer), reserves the machine, and updates their view in real time, with layered timeouts that automatically promote the next person if someone doesn't respond in time.

---

## ⚡ Technical Highlights

- **Asynchronous job-queue engine.** Machine allocation runs on BullMQ + Redis: delayed jobs schedule timed confirmation windows, handle automatic timeout-and-retry, and cascade through the queue on non-response, keeping the allocation logic off the request path.
- **Fixed a check-then-act race condition.** Concurrent reservation requests could bypass the per-user machine limit. Solved with PostgreSQL `SELECT FOR UPDATE` row-level locking inside transactions, so the limit holds even under simultaneous requests.
- **98% latency reduction under load.** Moving matching into async workers dropped average API response time from **3.07 s to 62 ms** and raised throughput ~3.8× (k6, 50 concurrent users), at a 0% error rate.
- **Resilient jobs.** Failed jobs retry 3× with exponential backoff, then land in a Dead Letter Queue for inspection.
- **Tested & automated.** Jest unit tests on the OOP domain classes, with CI/CD via GitHub Actions on every push.

---

## 🔐 Security

- Passwords are **bcrypt-hashed**, never stored in plain text
- Identity comes from a **signed JWT**, taken from the verified token rather than the request body
- **Role-based access control** (student/admin), with registration restricted to admins and no public self-signup
- Every protected route re-verifies the token and role **on the backend**, so tampering with the frontend achieves nothing
- Secrets live only in each host's encrypted environment settings and are never committed to git

---

## 🧰 Tech Stack

**Frontend:** React, Vite, Tailwind CSS
**Backend:** Node.js, Express, Socket.io, BullMQ
**Data:** PostgreSQL (Neon), Redis (Upstash)
**Auth:** JWT, bcrypt
**Infra / Tooling:** Vercel, Render, GitHub Actions, k6, Jest

---

## 🚀 Running Locally

**Prerequisites:** Node.js 18+, PostgreSQL, Redis (or an Upstash account)

```bash
git clone https://github.com/ishitaj15/ocupado.git
cd ocupado

# Backend
cd backend && npm install
cp .env.example .env      # fill in your values
npm run dev

# Frontend (new terminal)
cd ../frontend && npm install && npm run dev
```

Load the schema, then create your first admin directly in the database (registration is admin-only by design):

```bash
psql -U postgres -d ocupado -f backend/src/db/schema.sql
# then, after inserting a user:
# UPDATE students SET role = 'admin' WHERE email = 'you@example.com';
```

---

## 🔮 What I'd Add Next

- Automatic email / push notifications when a machine becomes available
- Password-change flow for students
- Usage-analytics dashboard (peak hours, average wait time)

---

## 👩‍💻 Author

**Ishita Jain**, Pre-final year B.Tech CSE (Cyber Security), LNCT&S Bhopal

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ishitaj15)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ishita-jain-179a68328)

---

*Built to solve a real problem. Every design decision was made for a reason.*
