---
name: Technical Precision
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2b2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c7c6ca'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#909094'
  outline-variant: '#46474a'
  surface-tint: '#c8c6c7'
  primary: '#c8c6c7'
  on-primary: '#303031'
  primary-container: '#1a1a1b'
  on-primary-container: '#848283'
  inverse-primary: '#5f5e5f'
  secondary: '#ffb3b1'
  on-secondary: '#680011'
  secondary-container: '#d6042f'
  on-secondary-container: '#ffe7e5'
  tertiary: '#c6c6c7'
  on-tertiary: '#2f3132'
  tertiary-container: '#181a1b'
  on-tertiary-container: '#818284'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e3'
  primary-fixed-dim: '#c8c6c7'
  on-primary-fixed: '#1b1b1c'
  on-primary-fixed-variant: '#474647'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b1'
  on-secondary-fixed: '#410007'
  on-secondary-fixed-variant: '#92001d'
  tertiary-fixed: '#e2e2e3'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-desktop: 80px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style

This design system is engineered to evoke the high-performance engineering of modern motorcycling. The brand personality is authoritative, precise, and adrenaline-fueled, balancing the technical rigor of a spec-heavy comparison site with the visceral excitement of the track. 

The aesthetic is a hybrid of **Minimalism** and **Technical Tactility**. It utilizes a dark-mode foundation to simulate the premium feel of carbon fiber and asphalt, contrasted against ultra-clean data displays. The UI should feel like a high-end digital instrument cluster: functional, immediate, and high-contrast. High-quality action photography is the primary emotive driver, while the interface remains disciplined and structured.

## Colors

The palette is rooted in a high-contrast, "After Dark" environment. 

- **Deep Carbon Black (#1A1A1B):** The primary canvas. It provides the depth needed for premium motorcycle photography to pop.
- **Racing Red (#E31837):** Used exclusively for critical actions, performance highlights, and active states. It represents the "redline" and should be used sparingly to maintain its impact.
- **Technical Grey (#F4F4F5):** Used for primary body text and data points to ensure maximum legibility against the dark background.
- **Surface Accents (#2A2A2B):** Subtle elevation shifts for cards and containers to separate sections without losing the dark aesthetic.

## Typography

The typography strategy emphasizes speed and technical clarity. 

**Hanken Grotesk** is used for headlines, providing a sharp, contemporary "engineered" feel. Large display headers should use heavy weights and tight letter spacing to mimic automotive branding.

**Inter** serves as the workhorse for comparison tables and descriptions, chosen for its exceptional legibility at small sizes.

**JetBrains Mono** is introduced as a secondary label font for technical specifications (e.g., CCs, Torque, Weight). This monospaced touch reinforces the "spec-sheet" and "data-driven" atmosphere of the platform.

## Layout & Spacing

This design system utilizes a **12-column fixed grid** for desktop (max-width 1440px) and a **4-column fluid grid** for mobile. 

The spacing rhythm is based on an **8px linear scale**. High-performance visuals require significant breathing room; therefore, section gaps are generous to prevent the technical data from feeling cluttered. 

- **Desktop:** 80px side margins with 24px gutters.
- **Tablet:** 40px side margins with 16px gutters.
- **Mobile:** 20px side margins. Content should stack vertically, with comparison "cards" becoming horizontally scrollable carousels to maintain spec readability.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Subtle Textures** rather than traditional drop shadows.

1.  **Base Level:** Deep Carbon Black (#1A1A1B) with a subtle, low-opacity carbon fiber pattern overlay (only visible on large displays).
2.  **Mid Level:** Surface Accents (#2A2A2B) used for cards and comparison containers.
3.  **High Level:** Racing Red (#E31837) for active elements.
4.  **Glassmorphism:** Navigation bars and spec-tooltips use a background blur (20px) with 10% opacity white fill to create a "heads-up display" (HUD) effect over motorcycle imagery.

Avoid heavy shadows. Instead, use 1px inner borders (strokes) in a slightly lighter grey (#3F3F41) to define edges.

## Shapes

The shape language is **aggressive and architectural**. 

A **Soft (0.25rem)** base radius is applied to maintain a modern feel without looking "bubbly" or consumer-soft. This sharp radius mimics the precision-cut parts of a motorcycle frame. 

- **Buttons & Inputs:** 4px (0.25rem) radius.
- **Cards & Large Containers:** 8px (0.5rem) radius.
- **Feature Tags/Chips:** 2px radius or completely sharp to denote technical rigidity.

## Components

### Buttons
- **Primary:** Racing Red background, white text, bold Hanken Grotesk. High-contrast hover state (shift to a darker red or add a 2px white bottom border).
- **Secondary:** Transparent background with a 1px Technical Grey border. 
- **Ghost:** Monospaced label text with a small chevron icon.

### Cards
- Comparison cards feature a "Hero" image area at the top. The bottom half uses a technical grid layout to display engine specs. Borders are thin (1px) and low-contrast.

### Data Visualization (The "Spec-Radar")
- Use a custom radar chart component to compare "Speed," "Handling," "Comfort," and "Tech." Lines should be Racing Red with a subtle outer glow.

### Inputs
- Form fields have a dark background (#000000), 1px grey border, and use JetBrains Mono for placeholder text to signal a "data-entry" feel.

### Chips & Tags
- Used for categories like "Superbike," "Touring," or "Electric." Small, all-caps, monospaced text with no background and a simple 1px border.**