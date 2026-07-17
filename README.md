# Studio OS

A modern, premium dark-themed project management operating system for creative teams. Built with **Next.js 15**, **TypeScript**, and **Tailwind CSS** featuring a stunning glassmorphism UI.

![Studio OS](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=flat-square&logo=tailwindcss)

## ✨ Features

- **Premium Dark UI** — Glassmorphism design with ambient glow effects
- **Dashboard** — Real-time project stats, activity feed, and progress tracking
- **Projects** — Grid view with status badges, progress bars, and team info
- **Tasks** — Filterable task list with priority indicators and status tracking
- **Settings** — Profile, appearance, and notification preferences
- **Responsive** — Mobile-first design with collapsible sidebar navigation
- **Animations** — Smooth fade-in, stagger, and micro-interactions

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 15 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS 4 | Utility-first styling |
| ESLint | Code quality |

## 📁 Project Structure

```
src/
├── app/            # Next.js App Router pages
│   ├── login/      # Login page
│   ├── dashboard/  # Dashboard with stats and activity
│   ├── projects/   # Project grid view
│   ├── tasks/      # Task list with filters
│   └── settings/   # User and workspace settings
├── components/     # Reusable UI components
├── features/       # Feature-specific modules
├── hooks/          # Custom React hooks
├── lib/            # Constants and configuration
├── services/       # Data services and mock data
├── styles/         # Additional style files
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/TezzraSapphirelabs/studio-OS.git
cd studio-OS

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
npm run build
npm start
```

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## 🎨 Design System

The application uses a custom design system featuring:

- **Color Palette** — Violet/Fuchsia primary with cyan accents
- **Glassmorphism** — Semi-transparent cards with backdrop blur
- **Typography** — Inter font via Google Fonts
- **Animations** — CSS keyframe animations with staggered children
- **Components** — GlassCard, StatCard, ProgressBar, Sidebar, TopBar

## 📝 License

This project is private and proprietary.
