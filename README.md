# DiveIQ

AI-powered dive planning and logging application for scuba divers.

## Overview

DiveIQ is a full-stack web application that helps divers plan safe dives and maintain comprehensive dive logs with intelligent, AI-assisted guidance. It provides real-time safety recommendations, tracks dive history with detailed statistics, and offers personalized insights for every dive.

## Key Features

### Dive Planning with AI Safety Analysis

Generate detailed dive plans and receive intelligent safety feedback powered by OpenAI. The AI analyzes depth, bottom time, experience level, and environmental factors to provide personalized recommendations.

### Comprehensive Dive Logging

Track every dive with detailed information including:

- Dive site and location
- Depth and bottom time
- Water conditions (temperature, visibility)
- Dive buddy information
- Personal notes and observations

### Real-Time Statistics Dashboard

View your diving activity at a glance with live statistics:

- Total dives logged
- Cumulative bottom time
- Deepest dive recorded
- Recent dive history and patterns

### Intelligent Risk Assessment

Automatic risk level calculation for planned dives based on multiple safety factors, helping divers make informed decisions.

## Technical Implementation

### Architecture

- **Full-stack Next.js 16** application with React 19 Server Components
- **TypeScript** for type safety and enhanced developer experience
- **Prisma ORM** with SQLite database for efficient data management
- **OpenAI API** integration for intelligent dive analysis

### UI/UX Design

- Custom **CSS Modules architecture** with comprehensive design system
- Centralized design tokens for consistent styling
- Responsive layouts optimized for desktop and mobile
- Dark theme optimized for diving environments
- Accessible, semantic HTML structure

### Performance Optimization

- Server-side rendering for fast initial page loads
- Optimistic UI updates for responsive user interactions
- Efficient database queries with Prisma
- Component-level CSS loading for minimal bundle size

### Code Quality

- Modular component architecture for maintainability
- Custom hooks for state management and business logic
- Form validation and error handling
- Type-safe API routes

## Project Structure

The application follows a feature-based architecture with clear separation of concerns:

```
src/
├── app/                    # Next.js app router & pages
├── features/              # Feature modules (dashboard, logging, planning)
├── components/            # Reusable UI components
├── lib/                   # Utilities and business logic
└── styles/               # CSS Modules & design system
```

## Technical Highlights

- **Modern React Patterns**: Server Components, client components, and custom hooks
- **Database Design**: Normalized schema with efficient relationships
- **API Integration**: RESTful endpoints with proper error handling
- **State Management**: React hooks with optimistic updates
- **Form Handling**: Controlled inputs with validation
- **Design System**: Token-based styling with CSS Modules for scalability

---

Built by [Ryan McDaniel](https://www.ryanmcdaniel.io/)
