# PUMP Design System Documentation

> **UI/UX Design System Documentation**  
> Generated from codebase analysis on February 3, 2026

---

## Table of Contents

1. [Current Vibe & Aesthetic](#1-current-vibe--aesthetic)
2. [Color Palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Component Styling](#4-component-styling)
5. [Layout & Responsiveness](#5-layout--responsiveness)
6. [Animation & Motion](#6-animation--motion)
7. [Component Reference](#7-component-reference)

---

## 1. Current Vibe & Aesthetic

### Overall Design Philosophy

**High-contrast dark mode with heavy gradient usage and glassmorphism effects.**

The PUMP fitness tracker features a **bold, premium dark theme** with a distinctive **purple-to-pink gradient accent system**. The design emphasizes:

- **Deep, immersive backgrounds** using multi-layered gradients (`gray-950` → `gray-900` → `black`)
- **Glassmorphism** with `backdrop-blur-sm` and semi-transparent backgrounds
- **Animated ambient orbs** creating dynamic, living backgrounds
- **Neon-inspired accent colors** (purple and pink) that convey energy and fitness motivation
- **Smooth, subtle transitions** on all interactive elements

### Design Tone

| Aspect | Description |
|--------|-------------|
| **Mood** | Energetic, motivational, premium |
| **Theme** | Dark mode exclusively |
| **Contrast** | High contrast for readability |
| **Feel** | Modern, app-like, fitness-focused |
| **Personality** | Bold yet refined |

---

## 2. Color Palette

### Primary Background Colors

| Color Token | Tailwind Class | Usage |
|-------------|----------------|-------|
| Near Black | `gray-950` | Primary page backgrounds |
| Dark Gray | `gray-900` | Page backgrounds, modal backgrounds |
| Medium Gray | `gray-800` | Card backgrounds, input fields, secondary containers |
| Light Gray | `gray-700` | Input backgrounds, secondary buttons, hover states |
| Border Gray | `gray-600` | Input borders, dividers |

### Accent Colors (Primary Actions)

| Color | Tailwind Class | Usage |
|-------|----------------|-------|
| **Purple** | `purple-600` / `purple-700` | Primary CTA buttons, active states |
| **Pink** | `pink-600` / `pink-700` | Gradient endpoints, accent highlights |
| **Blue** | `blue-600` / `blue-700` | Auth page buttons (Login/Register), info actions |

### Gradient Patterns

```css
/* Primary CTA Gradient */
bg-gradient-to-r from-purple-600 to-pink-600
hover:from-purple-700 hover:to-pink-700

/* Page Background Gradient */
bg-gradient-to-br from-gray-950 via-gray-900 to-black

/* Card Background Gradient */
bg-gradient-to-br from-purple-900/30 to-purple-800/30

/* Welcome Section Gradient */
bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-purple-900/40
```

### Status Colors

| Status | Class | Example Usage |
|--------|-------|---------------|
| Success | `green-500`, `green-400` | Active badges, beginner difficulty |
| Warning | `yellow-500`, `yellow-600` | Intermediate difficulty, pause button |
| Danger | `red-600`, `red-500` | Delete buttons, error messages, advanced difficulty |

### Semantic Color Mappings

```typescript
// Difficulty colors (ExerciseCard.tsx)
const difficultyColors = {
    Beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
    Intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};
```

### Quick Action Button Gradients

| Action | Gradient |
|--------|----------|
| Programs | `from-purple-600 to-pink-600` |
| History | `from-blue-600 to-cyan-600` |
| Exercises | `from-green-600 to-emerald-600` |
| Records | `from-yellow-600 to-orange-600` |

---

## 3. Typography

### Font Family

The application uses **system fonts / default Tailwind font stack**. No custom fonts are configured in `tailwind.config.js`.

### Heading Hierarchy

| Element | Classes | Example |
|---------|---------|---------|
| **H1 (Page Title)** | `text-2xl sm:text-3xl md:text-4xl font-bold text-white` | "Welcome Back, User!" |
| **H2 (Section Title)** | `text-2xl font-bold text-white` | "Create Account", "My Programs" |
| **H3 (Card Title)** | `text-xl font-bold text-white` | "Active Program", "Rest Timer" |
| **H4 (Sub-heading)** | `text-lg font-bold text-white` | "Quick Actions" |

### Text Sizes

| Size Class | Usage |
|------------|-------|
| `text-3xl` | Logo / Brand name |
| `text-2xl` | Modal titles, main headings |
| `text-xl` | Card titles, loading messages |
| `text-lg` | Section headings |
| `text-base` | Standard body text |
| `text-sm` | Labels, meta information |
| `text-xs` | Badges, helper text |

### Text Color Hierarchy

| Purpose | Class | Color |
|---------|-------|-------|
| Primary text | `text-white` | Pure white |
| Secondary text | `text-gray-400` | Muted gray |
| Tertiary text | `text-gray-500` | Subdued gray |
| Accent text | `text-purple-300`, `text-purple-400` | Purple tints |
| Error text | `text-red-200`, `text-red-400` | Error red |
| Link text | `text-blue-400`, `text-blue-500` | Interactive blue |

### Text Weight Scale

| Weight Class | Usage |
|--------------|-------|
| `font-bold` | Headings, buttons, CTAs |
| `font-semibold` | Button text, important labels |
| `font-medium` | Form labels, badges |
| (default 400) | Body text, descriptions |

---

## 4. Component Styling

### Buttons

#### Primary Button (Purple Gradient)
```html
<button class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 
               hover:from-purple-700 hover:to-pink-700 text-white 
               rounded-lg font-semibold transition-all duration-200 
               transform hover:scale-105">
</button>
```

#### Primary Button (Solid Purple)
```html
<button class="px-4 py-3 bg-purple-600 hover:bg-purple-700 
               text-white rounded-lg font-semibold transition-colors">
</button>
```

#### Primary Button (Blue - Auth Pages)
```html
<button class="w-full bg-blue-600 hover:bg-blue-700 text-white 
               font-bold py-2 px-4 rounded transition duration-200">
</button>
```

#### Secondary Button (Gray)
```html
<button class="px-4 py-3 bg-gray-800 hover:bg-gray-700 
               text-white rounded-lg font-semibold transition-colors">
</button>
```

#### Danger Button
```html
<button class="px-4 py-3 bg-red-600 hover:bg-red-700 
               text-white rounded-lg font-semibold transition-colors">
</button>
```

#### Button States

| State | Styling |
|-------|---------|
| Default | Standard colors |
| Hover | Darker shade (`-700`), optional scale (`scale-105`) |
| Disabled | `opacity-50 cursor-not-allowed` |
| Loading | `opacity-50 cursor-not-allowed` + loading text |

### Cards

#### Standard Card
```html
<div class="bg-gray-900/50 backdrop-blur-sm border border-gray-800 
            rounded-xl p-6 shadow-lg">
</div>
```

#### Interactive Card
```html
<div class="group bg-gray-800/50 backdrop-blur-sm rounded-xl 
            border border-gray-700/50 p-6 
            hover:border-purple-500/50 hover:bg-gray-800/70 
            transition-all duration-300 cursor-pointer">
</div>
```

#### Accent Card (Purple Theme)
```html
<div class="bg-gradient-to-br from-purple-900/30 to-purple-800/30 
            backdrop-blur-sm border border-purple-500/30 
            rounded-xl p-6 shadow-lg">
</div>
```

### Input Fields

#### Standard Input
```html
<input class="w-full bg-gray-700 border border-gray-600 rounded 
              px-3 py-2 text-white 
              focus:outline-none focus:border-blue-500" />
```

#### Input with Label
```html
<label class="block text-sm font-medium text-gray-400 mb-1">Label</label>
<input class="w-full px-4 py-3 bg-gray-800 border border-gray-700 
              rounded-lg text-white placeholder-gray-500 
              focus:outline-none focus:border-purple-500 transition-colors" />
```

### Modals

```html
<!-- Overlay -->
<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 
            flex items-center justify-center p-4">
    
    <!-- Modal Container -->
    <div class="bg-gray-900 rounded-xl border border-gray-800 
                max-w-md w-full p-6 shadow-2xl">
        
        <!-- Modal Title -->
        <h2 class="text-2xl font-bold text-white mb-2">Title</h2>
        
        <!-- Modal Content -->
        <p class="text-gray-400">Content here...</p>
        
    </div>
</div>
```

### Badges / Pills

```html
<!-- Status Badge -->
<span class="px-3 py-1 bg-green-500/20 text-green-300 rounded-full 
             text-xs font-medium border border-green-500/30">
    Active
</span>

<!-- Tag Badge -->
<span class="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-xs 
             rounded-lg border border-purple-500/30 font-medium">
    Muscle Group
</span>
```

### Border Radius Scale

| Class | Usage |
|-------|-------|
| `rounded` | Default inputs |
| `rounded-lg` | Buttons, badges, small cards |
| `rounded-xl` | Cards, modals |
| `rounded-2xl` | Large feature cards (Welcome section) |
| `rounded-full` | Avatar circles, pill badges |

### Shadows

| Class | Usage |
|-------|-------|
| `shadow-lg` | Standard cards |
| `shadow-xl` | Elevated cards on hover |
| `shadow-2xl` | Modals, important dialogs |
| `shadow-lg shadow-purple-500/20` | Purple-tinted hover shadows |

---

## 5. Layout & Responsiveness

### Breakpoints (Tailwind Default)

| Breakpoint | Min Width | Example Usage |
|------------|-----------|---------------|
| `sm:` | 640px | Show hidden elements, adjust padding |
| `md:` | 768px | 2-column grids, layout changes |
| `lg:` | 1024px | 3-column grids, sidebar layouts |
| `xl:` | 1280px | Max container widths |

### Container Patterns

```html
<!-- Standard Page Container -->
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
</div>

<!-- Auth Page Container -->
<div class="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
</div>
```

### Grid Patterns

```html
<!-- Dashboard 2-Column Grid -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
</div>

<!-- Cards Grid (Responsive) -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
</div>

<!-- Quick Actions (2 or 4 columns) -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
</div>
```

### Flexbox Patterns

```html
<!-- Centered Layout -->
<div class="min-h-screen flex items-center justify-center">
</div>

<!-- Header Layout -->
<div class="flex items-center justify-between">
</div>

<!-- Spaced Content -->
<div class="flex items-center space-x-3">
</div>
```

### Responsive Typography

```html
<!-- Responsive Heading -->
<h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
</h1>

<!-- Toggle Visibility -->
<span class="hidden sm:inline">Desktop only text</span>
```

### Mobile-First Patterns

- **Touch targets**: Minimum `min-h-[44px]` for buttons
- **Padding**: `px-4` on mobile, `sm:px-6 lg:px-8` on larger screens
- **Gap scaling**: `gap-2 sm:gap-3` or `gap-4 sm:gap-6`
- **Horizontal scrolling**: Avoided in favor of grid collapse

---

## 6. Animation & Motion

### Transitions

| Pattern | Classes |
|---------|---------|
| Color transitions | `transition-colors` |
| All properties | `transition-all duration-200` / `duration-300` |
| Opacity + transform | `transition-all duration-700` |

### Hover Effects

```html
<!-- Scale on hover -->
<div class="transform hover:scale-105 transition-all duration-200">
</div>

<!-- Color shift -->
<button class="hover:bg-purple-700 transition-colors">
</button>

<!-- Border color shift -->
<div class="hover:border-purple-500/50 transition-all duration-300">
</div>
```

### Animated Background Orbs

```html
<!-- Pulsating ambient orbs -->
<div class="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 
            rounded-full blur-3xl animate-pulse">
</div>
<div class="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/20 
            rounded-full blur-3xl animate-pulse delay-700">
</div>
```

### Page Mount Animations

```html
<!-- Fade-in with slide-up -->
<div class={`transition-all duration-700 ${mounted 
    ? 'opacity-100 translate-y-0' 
    : 'opacity-0 translate-y-4'}`}>
</div>
```

### Progress Animations

```html
<!-- Animated progress bar -->
<div class="h-full bg-gradient-to-r from-purple-500 to-pink-500 
            transition-all duration-1000">
</div>

<!-- Circular progress (SVG) -->
<circle class="text-purple-500 transition-all duration-1000" />
```

---

## 7. Component Reference

### Pages

| Page | Background Style |
|------|------------------|
| Login/Register | `bg-gray-900` (solid) |
| Dashboard | `bg-gradient-to-br from-gray-950 via-gray-900 to-black` + animated orbs |
| Programs | `bg-gradient-to-br from-gray-950 via-gray-900 to-black` + animated orbs |
| Active Workout | `bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20` |

### Header Pattern

```html
<header class="border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
            <!-- Content -->
        </div>
    </div>
</header>
```

### Logo Styling

```html
<div class="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 
            bg-clip-text text-transparent">
    PUMP
</div>
```

### Error Messages

```html
<!-- Auth Error -->
<div class="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
</div>

<!-- Page Error -->
<div class="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
</div>
```

### Loading States

```html
<div class="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black 
            flex items-center justify-center">
    <div class="text-white text-xl">Loading...</div>
</div>
```

---

## Quick Reference: Common Class Combinations

### Card Container
```
bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg
```

### Primary Button
```
px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors
```

### Gradient CTA
```
bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105
```

### Form Input
```
w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors
```

### Modal Overlay
```
fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4
```

---

*This design system document was auto-generated by analyzing the PUMP fitness tracker codebase. All patterns are based on actual implementations found in React components using Tailwind CSS.*
