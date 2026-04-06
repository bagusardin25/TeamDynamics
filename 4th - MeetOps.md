# 📅 MeetOps

> **The Centralized Workplace Meeting & Room Operations Platform.**

---

## 🚀 Hero Description

**MeetOps** is a modern, production-grade workplace operations SaaS platform designed to help organizations manage meeting rooms, prevent scheduling conflicts, and streamline meeting workflows through a centralized booking system. Built with scalability and user experience in mind, it provides a seamless interface for teams to collaborate without the friction of double-bookings or lost schedules.

---

## 🔗 Live Demo
[**View Live Application (Placeholder)**](https://demo.meetops.app)

---

## 🎯 Core Purpose

In fast-paced startups and coworking environments, meeting room conflicts cause significant productivity losses. MeetOps solves this real-world problem by providing:
- Absolute prevention of double-bookings.
- Clear, real-time visibility into room availability.
- A structured approval workflow for high-demand resources.

---

## 🏆 Product Context

MeetOps was developed **solo** as a submission for the **TestSprite Hackathon**. The project demonstrates a complete, end-to-end SaaS architecture with integrated AI testing, robust authentication, and complex data relations.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **Authentication System** | Secure login, registration, and session management via Supabase. |
| **Protected Dashboard** | Personalized view of upcoming meetings and pending approvals. |
| **Room Management** | Create, edit, and manage physical or virtual meeting spaces. |
| **Meeting Scheduling** | Intuitive booking system with instant availability checking. |
| **Conflict Detection** | Smart validation prevents overlapping bookings for the same room. |
| **Approval Workflow** | Admin controls for reviewing, approving, or declining requests. |
| **Meeting Calendar** | Visual monthly and weekly grid of all organizational events. |
| **Role-Based Access** | Strict distinction and permissions between Users and Admins. |
| **Lifecycle Tracking** | Automated transition of meetings from Pending → Approved → Completed. |
| **Search & Filtering** | Find meetings instantly by title, room, or specific date. |
| **Activity Dashboard** | Real-time metrics and summary cards for account activity. |

---

## 🛠️ Tech Stack

| Technology | Usage |
| :--- | :--- |
| **React + Vite** | Blazing fast frontend framework and build tool. |
| **TypeScript** | End-to-end type safety and developer experience. |
| **TailwindCSS** | Utility-first CSS framework for a responsive, modern dark SaaS UI. |
| **Shadcn UI** | Accessible, customizable component primitives. |
| **Supabase** | Backend-as-a-service natively powering Auth & Database. |
| **PostgreSQL** | Relational database handling complex queries and constraints. |
| **Row Level Security** | Database-level protection ensuring users only see their data. |
| **TestSprite MCP** | AI-driven native automated workflow testing and validation. |

---

## 📂 Project Structure

```text
meetops/
├── src/
│   ├── components/      # Reusable UI components (Modals, Navbars)
│   ├── contexts/        # React Context providers (AuthContext)
│   ├── pages/           # Route views (Dashboard, Meetings, Admin, etc.)
│   ├── services/        # Supabase API clients (rooms, meetings)
│   ├── types/           # Global TypeScript definitions
│   ├── index.css        # Global styles and Tailwind directives
│   └── main.tsx         # Application entry point
├── testsprite_tests/    # Automated TestSprite MCP workflows
├── supabase/            # Database migrations and configuration
├── .env                 # Environment variables
└── package.json         # Project dependencies
```

---

## 🛣️ Routes

**Public Routes**
- `/login` — User authentication portal.
- `/register` — New account creation.

**Private Routes (Protected)**
- `/dashboard` — Main activity and upcoming overview.
- `/meetings` — Filterable meeting list and history.
- `/meetings/new` — Meeting creation and scheduling wizard.
- `/calendar` — Visual grid view of all scheduled rooms.
- `/rooms` — Resource management (Admin only).
- `/admin` — Approval workflows and global oversight (Admin only).

---

## 🔌 API Connections

Interactions are handled directly via the Supabase client. Examples:
- `getMeetings()` — Fetches all organization meetings (Admin).
- `getUserMeetings(uid)` — Fetches meetings specific to the logged-in user.
- `createMeeting(data)` — Inserts a new booking request.
- `cancelMeeting(id)` — Cancels a booking with ownership validation.

---

## 🗄️ Database Structure

The PostgreSQL database utilizes strict Row Level Security (RLS) across 4 core tables:

- **`users`** — Extended profiles linking Auth models to application roles.
- **`rooms`** — Manageable physical spaces with capacity limits.
- **`meetings`** — The core entity containing timestamps, relations, and status enums.
- **`notifications`** — System alerts for status changes and approvals.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory. Example:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 💻 Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Create `.env` and configure your keys.

3. **Run dev server:**
   ```bash
   npm run dev
   ```

---

## 🧪 Testing

MeetOps uses **TestSprite MCP** for comprehensive, AI-driven automated testing. End-to-end testing relies on the automated workflow testing engine handling browser interaction.

- All test cases, reports, and AI visualizations reside in the `testsprite_tests/` directory.
- Test workflows natively validate complex constraints like double-booking protection and authorization limits.

---

## 🚢 Production Commands

**Build the application:**
```bash
npm run build
```

**Start the preview server:**
```bash
npm run preview
```

---

## 🔒 Security Notes

- **Auth Protection**: Internal routes require active sessions.
- **Role Enforcement**: Administrator-only paths (Admin Approvals, Room Creation) enforce role verification at the component and database level.
- **Meeting Permissions**: Users are strictly limited to canceling/modifying their own generated bookings, validated across the stack.

---

## 🔄 Meeting Workflow Summary

1. **Create Meeting**: A user selects a room and specifies a requested time block.
2. **Conflict Validation**: MeetOps verifies real-time that no conflicting meeting holds that slot.
3. **Approval**: Bookings enter an initial `Pending` state for administrators to `Approve` or `Decline`.
4. **Lifecycle**: Upon passing the meeting's scheduled end time, active bookings gracefully transition to `Completed`.

---

## 🚧 Current Constraints

- No recurring meetings yet.
- Email notifications not implemented.

---

## 👨‍💻 Author

Built **solo** for the TestSprite Hackathon.

---

## 📜 License

MIT License.