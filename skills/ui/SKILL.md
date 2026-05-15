---
name: Precision Network System
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#474550'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#787581'
  outline-variant: '#c9c4d2'
  surface-tint: '#5c559b'
  primary: '#3b3377'
  on-primary: '#ffffff'
  primary-container: '#524b90'
  on-primary-container: '#c9c2ff'
  inverse-primary: '#c6bfff'
  secondary: '#676000'
  on-secondary: '#ffffff'
  secondary-container: '#f2e302'
  on-secondary-container: '#6b6400'
  tertiary: '#4e3a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b5000'
  on-tertiary-container: '#eac46e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4dfff'
  primary-fixed-dim: '#c6bfff'
  on-primary-fixed: '#180d54'
  on-primary-fixed-variant: '#453d82'
  secondary-fixed: '#f5e60b'
  secondary-fixed-dim: '#d7ca00'
  on-secondary-fixed: '#1f1c00'
  on-secondary-fixed-variant: '#4d4800'
  tertiary-fixed: '#ffdf9b'
  tertiary-fixed-dim: '#e8c26d'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5a4300'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
  surface-gray: '#F8F9FA'
  border-subtle: '#E0E0E0'
  network-blue-dark: '#3A3469'
typography:
  headline-xl:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1200px
---

## Brand & Style

This design system is engineered for a high-reliability technology and networking environment. The brand personality is rooted in **precision, stability, and corporate authority**, reflecting the rigorous standards of Japanese infrastructure and telecommunications. 

The visual style follows a **Corporate Modern** aesthetic. It prioritizes clarity over ornamentation, utilizing a structured grid, generous whitespace, and a high-contrast palette to convey professional competence. UI elements are crisp and purposeful, avoiding unnecessary trends in favor of timeless usability and a sense of "built-to-last" digital engineering.

## Colors

The palette is anchored by **Deep Indigo (#524B90)**, representing wisdom, stability, and the "blue-chip" nature of the networking industry. **Signal Yellow (#F2E300)** is used sparingly as a high-visibility accent for calls to action and critical status indicators, providing a sharp contrast that ensures essential information is never missed.

- **Primary**: Use for headers, primary buttons, and brand-identifying icons.
- **Secondary (Accent)**: Reserved for primary action buttons, hover states, and active notifications.
- **Neutral**: The charcoal tone (#333333) is used for body text to maintain high legibility while appearing softer than pure black.
- **Backgrounds**: Pure white (#FFFFFF) is the primary canvas, with light gray (#F8F9FA) used for section zoning and container backgrounds.

## Typography

The typography system balances the geometric boldness of **Montserrat** for headings with the systematic precision of **Hanken Grotesk** for body and UI text.

1.  **Headlines**: Set in Montserrat. Use Bold (700) for primary titles to establish a strong hierarchy.
2.  **Body Text**: Set in Hanken Grotesk. The line height is set to a comfortable 1.6x to ensure legibility in technical documentation and long-form service descriptions.
3.  **Data & Labels**: Labels should utilize Hanken Grotesk with slightly increased letter spacing and Semi-Bold weights to differentiate them from standard body text.

## Layout & Spacing

This design system employs a **Fixed-Fluid Hybrid Grid**. Content is housed in a centered container with a maximum width of 1200px to maintain readability on wide monitors.

- **Grid**: A 12-column system is used for desktop, collapsing to 4 columns for mobile.
- **Rhythm**: All spacing (margins, padding, gaps) follows a 4px baseline unit. 
- **Vertical Spacing**: Use large vertical padding (80px - 120px) between major landing sections to reinforce a premium, uncluttered corporate feel.
- **Responsive Behavior**: At the 768px breakpoint (tablet), margins reduce to 24px and typography scales down according to the defined mobile roles.

## Elevation & Depth

Depth is used conservatively to maintain a "flat-plus" professional appearance. We rely on **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Surface Levels**: Level 0 is the white background. Level 1 (cards/containers) uses a subtle 1px border (#E0E0E0).
- **Shadows**: Only used for interactive overlays (dropdowns, modals). Use a very diffused, low-opacity indigo tint: `0px 10px 30px rgba(82, 75, 144, 0.08)`.
- **Interactive States**: Elements should not "lift" physically but rather change fill color or border weight to indicate focus.

## Shapes

The shape language is primarily **Soft (0.25rem)**. This slight rounding takes the edge off the "industrial" feel of the networking sector while remaining much more structured than consumer-facing "bubbly" apps.

- **Buttons & Inputs**: 4px border-radius (0.25rem).
- **Cards & Sections**: 8px border-radius (0.5rem).
- **Icons**: Icons should feature a consistent stroke weight and slightly rounded caps to match the UI components.

## Components

### Buttons
- **Primary**: Deep Indigo (#524B90) background with white text. High-contrast hover state using a darker indigo.
- **Secondary Action**: Signal Yellow (#F2E300) with charcoal text. Used only for the most important "Contact" or "Order" actions.
- **Ghost**: 1px indigo border with indigo text. Used for secondary navigation or "Read More" links.

### Input Fields
Inputs should have a 1px border (#E0E0E0) and a subtle Hanken Grotesk label positioned above the field. On focus, the border changes to Indigo with a 2px stroke.

### Cards
Cards are white with a 1px #E0E0E0 border. They do not use shadows unless they are "Hover-Active," in which case a soft indigo-tinted shadow is applied to indicate selectability.

### Chips & Tags
Used for categorizing technical services. Chips should use a light gray background with Charcoal text, or a very pale Indigo tint for active filters.

### Navigation
The main navigation should be clean and persistent. Use Montserrat Medium (500) for top-level links with a 3px Indigo underline appearing on the active state.