# ZkVaultService Style Guidelines

Dark mode only. Modern tech aesthetic with subtle animations.

## Color Palette

| Role | Color | Usage |
|------|-------|-------|
| Background Primary | `#0a0a0a` | Main background |
| Background Secondary | `#111111` | Cards, panels |
| Background Tertiary | `#1a1a1a` | Hover states |
| Emerald Primary | `#10b981` | Primary actions, accents |
| Emerald Dark | `#059669` | Active/pressed states |
| Emerald Light | `#34d399` | Highlights, hover glow |
| Emerald Subtle | `#064e3b` | Glow effects, borders |
| Text Primary | `#f5f5f5` | Main text |
| Text Secondary | `#a1a1aa` | Muted text |
| Text Accent | `#d1fae5` | Emphasized text |
| Success | `#22c55e` | Verified states |
| Border | `#1f2937` | Subtle borders |
| Border Glow | `#10b98133` | Container borders |

## Typography

- **Font Family**: `var(--font-geist-sans)` (UI), `var(--font-geist-mono)` (technical data)
- **Headings**: Bold, tracking-tight
- **Body**: Regular, leading-relaxed
- **Code/Data**: Monospace, smaller size

## Spacing System

- Base unit: 4px
- Container max-width: `max-w-4xl`
- Section padding: `py-24` to `py-32`
- Card padding: `p-6` to `p-8`
- Gap between elements: `gap-4` to `gap-8`

## Component Styles

### Cards
- Background: `#111111`
- Border: 1px solid `#1f2937`
- Border radius: `rounded-xl`
- Hover: border transitions to emerald glow (`#10b981`)

### Buttons
- Primary: Emerald background (`#10b981`), dark text
- Hover: Emerald light (`#34d399`) with subtle glow
- Disabled: 50% opacity

### Inputs
- Background: `#1a1a1a`
- Border: 1px solid `#1f2937`
- Focus: Emerald glow border

### Badges/Tags
- Background: `#064e3b` (emerald-subtle)
- Text: `#34d399`

## Animations

| Effect | Duration | Easing |
|--------|----------|--------|
| Fade in | 150-200ms | ease-out |
| Hover transition | 200ms | ease |
| Glow pulse | 2s | ease-in-out (infinite) |
| Slide up | 300ms | ease-out |

## Visual Effects

- **Glow**: `box-shadow: 0 0 20px #10b98133`
- **Glassmorphism**: `backdrop-blur-sm` with slight green tint
- **Grid pattern**: Subtle dot grid background on hero sections
- **Noise texture**: Optional subtle grain overlay

## Usage

```tsx
// Card with emerald glow
<div className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-6">

// Button
<button className="bg-emerald-600 hover:bg-emerald-500 text-black font-medium rounded-lg px-6 py-3 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">

// Badge
<span className="bg-emerald-900/50 text-emerald-400 text-xs px-2 py-1 rounded-full">
```