# PUMP Design System: Midnight Pro

> **Theme**: Midnight Pro  
> **Primary Colors**: Slate-950 (Background), Lime-400 (Accent)  
> **Icons**: lucide-react (no emojis)  
> **Design Philosophy**: Deep immersion, high performance, glassmorphism.

---

## 1. Core Aesthetics

**Midnight Pro** is a premium, dark-mode-first design system built for focus and clarity. It replaces the previous "neon synthwave" look with a more professional, "stealth mode" aesthetic inspired by modern pro tools.

### Key Characteristics
- **Deep Backgrounds**: `bg-slate-950` as the foundation, providing a void-like depth.
- **Glassmorphism**: Extensive use of `bg-slate-900/30` with `backdrop-blur-xl` for layering content without losing context.
- **Lime Accents**: `lime-400` is used strategically for primary actions, active states, and success indicators, offering high contrast against the dark background.
- **Fat-finger Friendly**: Large touch targets (min 44px, up to 72px for primary actions) for easy mobile use during workouts.

---

## 2. Color Palette

### Backgrounds
| Token | Tailwind Class | description |
|-------|----------------|-------------|
| **Void** | `bg-slate-950` | Main application background. |
| **Glass** | `bg-slate-900/30` | Standard card background with transparency. |
| **Overlay** | `bg-black/80` | Modal backdrops. |

### Accents
| Token | Tailwind Class | Usage |
|-------|----------------|-------|
| **Lime** | `text-lime-400` | Primary text highlight, active icons, checks. |
| **Glow** | `shadow-lime-400/20` | Subtle glow for active elements and hero buttons. |

### Set Type Accents
| Type | Border | Text | Badge BG | Icon |
|------|--------|------|----------|------|
| **Normal** | `border-lime-400` | `text-lime-400` | — | `Dumbbell` |
| **Warmup** | `border-amber-400` | `text-amber-400` | `bg-amber-500/10` | `ThermometerSun` |
| **Dropset** | `border-purple-400` | `text-purple-400` | `bg-purple-500/10` | `Layers` |
| **Failure** | `border-red-400` | `text-red-400` | `bg-red-500/10` | `AlertCircle` |

### Text
| Token | Tailwind Class | Usage |
|-------|----------------|-------|
| **Primary** | `text-white` | Headings, primary content. |
| **Secondary**| `text-slate-400` | Labels, meta info, inactive states. |
| **Muted** | `text-slate-600` | Placeholders, disabled text. |

---

## 3. UI Components (CSS Classes)

These utility classes are defined in `index.css` and should be used for consistency.

### Glass Cards
```css
/* Standard Card - Used for lists, forms, stats */
.glass-card {
    @apply bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-xl;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
}

/* Large Card - Used for major sections, auth forms */
.glass-card-lg {
    @apply bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl;
    /* ...same shadow... */
}

/* Accent Card - Used for "Quick Actions" hover or active items */
.glass-card-accent {
    @apply bg-slate-900/30 backdrop-blur-xl border border-lime-400/20 rounded-xl;
}
```

### Buttons
```css
/* Primary Action - "Log Set", "Save", "Login" */
.btn-primary {
    @apply bg-lime-400 text-slate-950 font-semibold rounded-lg hover:bg-lime-500 transition-all duration-200;
}

/* Secondary Action - "Cancel", "Back", "Next" */
.btn-secondary {
    @apply bg-slate-900/30 text-slate-200 font-semibold rounded-lg hover:bg-slate-800/50 transition-all duration-200 border border-white/10;
}

/* Hero Button - "Start Workout", "Finish Workout" */
.btn-hero {
    @apply bg-lime-400 text-slate-950 font-bold rounded-xl hover:bg-lime-500 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-lime-400/20;
}
```

### Inputs
```css
/* Standard Input */
.input-midnight {
    @apply bg-slate-900/30 border border-white/10 rounded-lg text-white placeholder-slate-500 
    focus:outline-none focus:border-lime-400/50 focus:ring-1 focus:ring-lime-400/30 transition-colors backdrop-blur-sm;
}
```

### Set Options Menu (Popover)
A mobile-first popover that opens from the set logger header. Contains a 2×2 grid of set type pills and an RPE number input.
```css
/* Popover Container */
.set-options-popover {
    /* absolute right-0 top-full mt-2 z-50 */
    @apply w-72 bg-slate-950 border border-white/10 rounded-xl shadow-2xl p-4;
}

/* Type Pill - Active */
.set-type-pill-active {
    @apply flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-semibold
        border bg-lime-400/10; /* + dynamic border/text color from Set Type Accents */
}

/* Type Pill - Inactive */
.set-type-pill-inactive {
    @apply flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-semibold
        border-transparent bg-slate-800/50 text-slate-400 hover:bg-slate-800;
}
```

### Set Type Badges (History View)
Small inline pills shown next to set numbers in `WorkoutDetailsPage` for non-NORMAL sets.
```css
/* Badge pill (10px text, inline-flex) */
.set-type-badge {
    @apply inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded
        uppercase tracking-wider font-medium ml-2;
    /* Warmup: bg-amber-500/10 text-amber-500 border border-amber-500/20 */
    /* Drop:   bg-purple-500/10 text-purple-500 border border-purple-500/20 */
    /* Failure: bg-red-500/10 text-red-500 border border-red-500/20 */
}

/* RPE indicator (history table) */
.rpe-indicator {
    @apply text-xs text-slate-500 font-mono tracking-tighter; /* e.g. "RPE 8" */
}
```

### Gamification (WelcomeSection)
| Element | Tailwind Classes |
|---------|-----------------|
| **Glass Badge** | `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 backdrop-blur-sm border border-white/10 text-sm` |
| **Smart Avatar (fallback)** | `w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 ring-2 ring-lime-400/50 text-lime-400 font-bold` |
| **Gradient Name** | `text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400` |

**Level Colors:**
| Level | Color |
|-------|-------|
| Novice (0–9) | `text-slate-400` |
| Regular (10–49) | `text-sky-400` |
| Pro (50–99) | `text-purple-400` |
| Elite (100+) | `text-amber-400` |

### Muscle Recovery Heatmap (BodyHeatmap)
Geometric/low-poly SVG visualization of front & back body views with per-muscle recovery coloring.

| Element | Tailwind Classes |
|---------|-----------------|
| **SVG Muscle (active)** | `fill-red-500` / `fill-amber-500` / `fill-lime-400` + `stroke-slate-600 cursor-pointer` |
| **SVG Muscle (dim)** | `fill-red-500/60` / `fill-amber-500/60` / `fill-lime-400/20` |
| **Detail Panel** | `bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl` |
| **Status Badge (Recovering)** | `bg-red-500/20 text-red-400 border-red-500/30 rounded-full` |
| **Status Badge (Resting)** | `bg-amber-500/20 text-amber-400 border-amber-500/30 rounded-full` |
| **Status Badge (Ready)** | `bg-lime-400/20 text-lime-400 border-lime-400/30 rounded-full` |
| **Strain Score Bar** | `h-2 bg-slate-800 rounded-full` with colored fill |
| **Quick Overview Button** | `p-2.5 rounded-xl border bg-slate-900/30 border-white/5 hover:border-white/10` |

**Interaction**: Click/tap to select muscle (no hover tooltips — mobile-first). Click outside to dismiss.

---

## 4. Typography Hierarchy

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| **Page Title** | `text-3xl` | `font-bold` | `text-white` |
| **Section Header** | `text-xl` | `font-bold` | `text-white` |
| **Label** | `text-sm` | `font-medium` | `text-slate-400` |
| **Stat Value** | `text-2xl` | `font-bold` | `text-lime-400` |
| **Body** | `text-base` | `font-normal` | `text-slate-200` |

---

## 5. Touch Interactions (Mobile First)

### Touch Targets
- **Standard Link/Button**: Min height `44px`.
- **Workout Controls** (+/- buttons): Expanded to `48px` x `56px` or larger.
- **Primary Hero Button**: Min height `72px` for main workout actions.

### Feedback
- **Active Scale**: Buttons scale down slightly (`active:scale-95`) on press to provide tactile feedback.
- **Hover**: Subtle brightness increase or border glow on desktop hover.

---

## 6. Navigation Components

### SmartNavbar
The global navigation component with hide-on-scroll behavior:
- **Desktop**: Sticky top navigation (`fixed top-0`) with glassmorphism
- **Mobile**: Fixed bottom navigation bar
- **Hide-on-scroll**: Uses `transform: translateY(-100%)` transition on scroll down
- **Icons**: All navigation links use `lucide-react` icons (`LayoutDashboard`, `Dumbbell`, `History`, `Library`, `Trophy`)
- **Offline Indicator**: Pulsing `WifiOff` icon (`text-red-400 animate-pulse`) appears next to logo when offline

```tsx
// Navigation Links (lucide-react icons)
const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/programs', label: 'Programs', icon: Dumbbell },
    { path: '/workout/history', label: 'History', icon: History },
    { path: '/exercises', label: 'Exercises', icon: Library },
    { path: '/personal-records', label: 'PRs', icon: Trophy },
];
```

### PWA Indicators

| Element | Styling |
|---------|---------|
| **Offline Badge (desktop)** | `flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20` |
| **Offline Badge (mobile)** | `flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20` |
| **Offline Icon** | `WifiOff` — `w-3.5 h-3.5 text-red-400 animate-pulse` (desktop), `w-3 h-3` (mobile) |
| **ReloadPrompt Toast** | `fixed bottom-24 md:bottom-6 z-[100]` — glassmorphism card with `RefreshCw` icon and lime-400 update button |

### UnifiedPageHeader
Consistent page header for all pages:
- **Props**: `title`, `subtitle?`, `showBackButton?`, `icon?: LucideIcon`, `rightContent?`
- **Icon rendering**: `{Icon && <Icon className="w-8 h-8 text-lime-400" />}`
- **Back Button**: Uses `navigate(-1)` for browser-like back navigation
- **Root Pages** (no back button): Dashboard, Programs, History
- **Nested Pages** (with back button): All detail/create pages

---

## 7. Layout Patterns

### MainLayout (AuthenticatedLayout)
Wrapper for all authenticated routes:
- Includes `SmartNavbar` persistently
- Handles logout functionality
- Manages padding for fixed navbars (desktop top, mobile bottom)

### Bento Grid (Dashboard)
- A modular grid layout using `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`.
- Items can span multiple columns (`col-span-2`) to emphasize importance (e.g., Weekly Stats).

### Sticky Headers
- Workout logs and lists often feature sticky headers (`sticky top-0`) with glassmorphism backgrounds to maintain context while scrolling.

### Rest Timer
- **Sticky Positioning**: `sticky top-24` ensures the timer is always visible during a workout without blocking content.
- **Circular Progress**: SVG-based visualization for intuitive time tracking.
- **Icons**: `Timer`, `Play`, `Pause`, `RotateCcw`, `SkipForward` from lucide-react.

---

## 8. Iconography (lucide-react)

All UI icons use the `lucide-react` library. **No emojis are used anywhere in the codebase.**

### Sizing Convention
| Context | Classes | Example |
|---------|---------|--------|
| Page headers | `w-8 h-8 text-lime-400` | `<Trophy className="w-8 h-8 text-lime-400" />` |
| Inline text / buttons | `w-4 h-4` | `<Check className="w-4 h-4" />` |
| Navigation (desktop) | `w-4 h-4` | With `flex items-center gap-1.5` |
| Navigation (mobile) | `w-5 h-5` | With `flex flex-col items-center` |
| Timer controls | `w-5 h-5` | With `flex items-center justify-center gap-2` |
| Empty states | `w-12 h-12` to `w-16 h-16` | `<Dumbbell className="w-16 h-16 text-slate-600" />` |
| Badge / tag icons | `w-3.5 h-3.5` | `<Wrench className="w-3.5 h-3.5" />` |

### Icon Inventory
| Icon | Import | Usage |
|------|--------|-------|
| `LayoutDashboard` | lucide-react | Dashboard nav |
| `Dumbbell` | lucide-react | Programs, exercises, muscle groups |
| `History` | lucide-react | Workout history |
| `Library` | lucide-react | Exercise library |
| `Trophy` | lucide-react | Personal records, PR badges |
| `LogOut` | lucide-react | Logout button |
| `WifiOff` | lucide-react | Offline status indicator (SmartNavbar) |
| `RefreshCw` | lucide-react | PWA update toast icon, PPL split type |
| `Home` | lucide-react | Dashboard (legacy header) |
| `Flame` | lucide-react | Streak badge, fire/intensity |
| `Rocket` | lucide-react | Footer branding |
| `Heart` | lucide-react | Footer branding |
| `Hand` | lucide-react | Welcome wave |
| `Zap` | lucide-react | Quick actions header |
| `TrendingUp` | lucide-react | Recent activity header |
| `User` | lucide-react | Profile page icon |
| `ChevronRight` | lucide-react | "View All" arrows |
| `ChevronLeft` | lucide-react | Back / Previous buttons |
| `Check` | lucide-react | Finish, Log Set, completion |
| `X` | lucide-react | Close, clear filters |
| `Calendar` | lucide-react | Date range filters |
| `BarChart3` | lucide-react | Progress charts |
| `SearchX` | lucide-react | Empty search state |
| `Target` | lucide-react | Target/goal labels |
| `Play` | lucide-react | Timer start/resume |
| `Pause` | lucide-react | Timer pause |
| `Timer` | lucide-react | Rest timer header |
| `RotateCcw` | lucide-react | Timer reset |
| `SkipForward` | lucide-react | Timer skip |
| `Pencil` | lucide-react | Edit set |
| `Trash2` | lucide-react | Delete set/item |
| `MoreVertical` | lucide-react | Set options menu trigger |
| `ThermometerSun` | lucide-react | Warmup set type indicator |
| `Layers` | lucide-react | Dropset type indicator |
| `AlertCircle` | lucide-react | Failure set type indicator |
| `Info` | lucide-react | Exercise info |
| `Video` | lucide-react | How-to-perform section |
| `Wrench` | lucide-react | Equipment tags |
| `PlusCircle` | lucide-react | Create new items |
| `RefreshCw` | lucide-react | PPL split type |
| `ArrowUpDown` | lucide-react | Upper/Lower split |
| `Activity` | lucide-react | Full Body split, Muscle Recovery header |
| `ArrowLeftRight` | lucide-react | Push/Pull split |
| `Settings` | lucide-react | Custom split |
| `Clock` | lucide-react | "Last trained" in heatmap tooltip |

### Alignment Rules
- **Buttons**: Always use `flex items-center gap-2`
- **Labels**: Use `flex items-center gap-1.5`
- **Section headers**: Use `flex items-center gap-2`
- **Badge tags**: Use `inline-flex items-center gap-1.5`

