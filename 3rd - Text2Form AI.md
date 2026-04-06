<div align="center">
  <h1> Text2Form </h1>
  <p><strong>Build beautiful forms and quizzes in seconds using natural language.</strong></p>
  <p><i>Powered by Gemini AI, built with Next.js, and backed by Supabase.</i></p>
</div>

<br />

## ✨ What It Does

**Text2Form** revolutionizes data collection by letting you create professional forms and quizzes by simply describing what you need in plain English. The AI generates a complete, interactive form that you can share with anyone via a unique link — and track all responses through a real-time analytics dashboard. 

Created for the **TestSprite Hackathon**, optimized for Innovation, Project Quality, and Test Quality.

---

## 🔗 Quick Links

- 🌐 **Live Demo**: [text2form.vercel.app](https://text2form.vercel.app/)
- 💻 **GitHub Repo**: [ayush002jha/Text2Form](https://github.com/ayush002jha/Text2Form)
- 🐦 **X / Twitter Post**: [View Roadmap/Update](https://x.com/ayush17_08/status/2033317642648609211)
- 🎥 **YT Demo Video**: [Watch Walkthrough](https://youtu.be/5FT3I4JnXno)

---

> [!IMPORTANT]
> **Built with Antigravity**: This project was built using **Antigravity** as the primary agentic coding IDE. All logic, UI refinements, and feature implementations were driven through the Antigravity agent.

## 💡 The "Why"

Data collection shouldn't be a chore. Most form builders require manual drag-and-drop, which can be tedious and restrictive. **Text2Form** democratizes form creation by putting the power of LLMs directly into the hands of the user. Whether you need a quick survey for a hackathon or a complex math quiz for a classroom, you just speak it into existence. We built this to show how agentic workflows can transform static web tools into dynamic, intelligent assistants.

### 🌟 Key Features

- 🤖 **AI-Powered Generation** — Describe your form in natural language (e.g., *"Make a 5-question math quiz for 8th graders"*), get a professional form in seconds.
- 📝 **Dynamic Form Rendering** — Our custom engine maps AI JSON to stunning Shadcn UI components (Text inputs, Textareas, Radio buttons, Checkboxes, and Selects).
- 🔗 **Shareable Links** — Every form gets a unique, public URL that anyone can access and fill out instantly.
- 📊 **Live Analytics Dashboard** — Real-time response tracking with data tables and Recharts visualizations.
- 🔐 **Optional Account Creation** — Continue as a guest for instant access, or log in with Google to manage your created forms and keep your analytics private dashboards secure.
- 🎨 **Premium UI/UX** — Stunning glassmorphism design with smooth micro-animations, tailored color palettes, and full dark mode.
- 🤖 **Agent-Ready Architecture** — Every interactive element is tagged with strict `data-testid` attributes specifically designed for the **TestSprite MCP agent** to auto-generate high-quality E2E test cases.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **AI** | Google Gemini 3.1 Flash Lite Preview |
| **Styling** | Tailwind CSS v4 + Shadcn UI |
| **Charts** | Recharts |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ayush002jha/Text2Form.git
   cd Text2Form
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   GEMINI_API_KEY=your-gemini-api-key
   ```

3. **Set up Supabase database**
   Run the SQL script found in `supabase/schema.sql` in your Supabase SQL Editor. This sets up the `forms` and `submissions` tables, along with the necessary Public RLS policies.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to see the app! 🎉

---

## 🏗️ Project Structure

```text
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/route.ts    # AI form generation endpoint
│   │   │   └── submit/route.ts      # Form submission endpoint
│   │   ├── f/[id]/page.tsx          # Public dynamic form renderer
│   │   ├── dashboard/[id]/page.tsx  # Analytics dashboard
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Home/Hero page
│   ├── components/
│   │   ├── ui/                      # Shadcn UI components (13 total)
│   │   ├── DynamicForm.tsx          # Dynamic rendering engine
│   │   ├── AnalyticsChart.tsx       # Recharts data visualization
│   │   └── SubmissionsTable.tsx     # Response data table
│   └── lib/
│       ├── supabase.ts              # Supabase client config
│       ├── gemini.ts                # Gemini AI client & prompts
│       ├── types.ts                 # Strict TypeScript definitions
│       └── utils.ts                 # Utility functions
├── supabase/
│   └── schema.sql                   # Supabase Database schema & RLS policies
├── testsprite_tests/                # AI-generated test cases (TestSprite)
├── README.md
└── demo.mp4                         # Video walkthrough
```

---

## 🧪 Testing (TestSprite)

As per the hackathon requirements, **there are no hand-written tests in this repository.**

All tests have been auto-generated using the **TestSprite MCP** agent evaluating the `data-testid` attributes seeded throughout our components. The fully agent-generated test cases are compiled in the `testsprite_tests/` directory.

---

## 📄 License & Credits

Created by **ayush002jha** for the TestSprite Hackathon.
Released under the MIT License.