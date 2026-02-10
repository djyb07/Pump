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
| `Home` | lucide-react | Dashboard (legacy header) |
| `Flame` | lucide-react | Fire/intensity |
| `Rocket` | lucide-react | Footer branding |
| `Heart` | lucide-react | Footer branding |
| `Hand` | lucide-react | Welcome wave |
| `Zap` | lucide-react | Quick actions header |
| `TrendingUp` | lucide-react | Recent activity header |
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
| `Info` | lucide-react | Exercise info |
| `Video` | lucide-react | How-to-perform section |
| `Wrench` | lucide-react | Equipment tags |
| `PlusCircle` | lucide-react | Create new items |
| `RefreshCw` | lucide-react | PPL split type |
| `ArrowUpDown` | lucide-react | Upper/Lower split |
| `Activity` | lucide-react | Full Body split |
| `ArrowLeftRight` | lucide-react | Push/Pull split |
| `Settings` | lucide-react | Custom split |

### Alignment Rules
- **Buttons**: Always use `flex items-center gap-2`
- **Labels**: Use `flex items-center gap-1.5`
- **Section headers**: Use `flex items-center gap-2`
- **Badge tags**: Use `inline-flex items-center gap-1.5`

