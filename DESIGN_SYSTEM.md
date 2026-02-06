# PUMP Design System: Midnight Pro

> **Theme**: Midnight Pro  
> **Primary Colors**: Slate-950 (Background), Lime-400 (Accent)  
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

## 6. Layout Patterns

### Bento Grid (Dashboard)
- A modular grid layout using `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`.
- Items can span multiple columns (`col-span-2`) to emphasize importance (e.g., Weekly Stats).

### Sticky Headers
- Workout logs and lists often feature sticky headers (`sticky top-0`) with glassmorphism backgrounds to maintain context while scrolling.

### Rest Timer
- **Sticky Positioning**: `sticky top-24` ensures the timer is always visible during a workout without blocking content.
- **Circular Progress**: SVG-based visualization for intuitive time tracking.
