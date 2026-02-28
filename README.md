# ESS (Employee Self Service) Mobile Web App

A modern, responsive mobile web application for employees to manage their HR-related tasks including attendance, leave, salary, and more.

## Features

- **Dashboard** - Overview of employee information and quick stats
- **Attendance** - Track daily attendance and view history
- **Leave Management** - Apply for leave and view leave balance
- **Salary** - View salary slips and detailed breakdown
- **Profile** - View and update personal information
- **Multi-language Support** - English and Arabic (RTL) support

## Tech Stack

- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **i18next** - Internationalization framework
- **Vite** - Build tool

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── app/              # App configuration and routing
├── auth/             # Authentication context
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── i18n/            # Internationalization setup
├── pages/           # Page components
├── services/        # API services
├── store/           # State management
├── styles/          # Global styles
└── utils/           # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Phase 1 Features (Completed)

- [x] Dashboard with employee overview
- [x] Attendance tracking and history
- [x] Leave application and balance
- [x] Salary slips and details
- [x] Profile management
- [x] Arabic/English language support
- [x] RTL layout support
- [x] Mobile-responsive design

## License

Private - For internal use only
