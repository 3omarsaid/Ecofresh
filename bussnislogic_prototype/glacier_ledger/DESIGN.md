---
name: Glacier Ledger
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#4f6073'
  primary: '#041627'
  on-primary: '#ffffff'
  primary-container: '#1a2b3c'
  on-primary-container: '#8192a7'
  inverse-primary: '#b7c8de'
  secondary: '#526069'
  on-secondary: '#ffffff'
  secondary-container: '#d3e2ed'
  on-secondary-container: '#56656e'
  tertiary: '#001b02'
  on-tertiary: '#ffffff'
  tertiary-container: '#003207'
  on-tertiary-container: '#53a252'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4fb'
  primary-fixed-dim: '#b7c8de'
  on-primary-fixed: '#0b1d2d'
  on-primary-fixed-variant: '#38485a'
  secondary-fixed: '#d6e5ef'
  secondary-fixed-dim: '#bac9d3'
  on-secondary-fixed: '#0f1d25'
  on-secondary-fixed-variant: '#3b4951'
  tertiary-fixed: '#a3f69c'
  tertiary-fixed-dim: '#88d982'
  on-tertiary-fixed: '#002204'
  on-tertiary-fixed-variant: '#005312'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-sm:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  data-mono:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  sidebar-width: 280px
  toolbar-height: 64px
---

## Brand & Style
The design system is engineered for the high-stakes environment of frozen food logistics and international export. It balances the cold, industrial nature of the product with the prestige of global trade.

**Target Audience:** Supply chain managers, export officers, and financial controllers in the Egyptian food industry.
**Style:** **Corporate / Modern** with high-density data visualization. The interface prioritizes utility and rapid information retrieval over decorative elements. It uses a structured, modular approach to manage complex workflows like cold-chain monitoring, customs documentation, and multi-currency ledger management.
**Emotional Response:** Stability, cold-chain integrity, professional rigor, and financial transparency.

## Colors
The palette is built on a foundation of "Trust and Temperature." 

- **Primary (Deep Navy - #1A2B3C):** Represents the corporate strength of the export sector. Used for navigation, primary headers, and high-level branding.
- **Secondary (Cold Blue - #E3F2FD):** A functional color used for row highlighting, focus states, and the "Frozen" thematic element. It provides a cool, accessible background for dense data.
- **Success (Green - #2E7D32):** Used specifically for profit margins, successful shipment status, and completed customs clearances.
- **Warning (Amber - #F57C00):** Reserved for temperature excursions in containers, payment delays, and expiring export licenses.
- **Neutral:** A spectrum of slate greys for secondary text, borders, and disabled states.

## Typography
This design system utilizes **IBM Plex Sans Arabic** for its exceptional clarity in technical and financial contexts. The typography is optimized for Right-to-Left (RTL) reading patterns.

- **Numbers:** Financial figures (EGP/USD) should use the Latin glyphs of the font to maintain alignment in dense tables and spreadsheets.
- **Hierarchy:** Use bold weights sparingly for primary identifiers (e.g., Container Numbers, Invoice IDs).
- **Alignment:** All text is right-aligned by default. Numeric columns in tables are left-aligned to facilitate decimal comparison.

## Layout & Spacing
The layout follows a **Fixed-Fluid hybrid** model optimized for 1440px displays common in corporate offices.

- **Grid:** A 12-column grid system is used for dashboard layouts.
- **RTL Direction:** The Sidebar Navigation is anchored to the right. The content flows from right to left.
- **Density:** This is a "High Density" system. Vertical padding in table rows and lists is kept to a minimum (8px to 12px) to maximize the "above-the-fold" data visibility.
- **Breakpoints:**
  - Desktop: 1280px+ (Full sidebar expanded)
  - Tablet: 768px - 1279px (Sidebar collapsed to icons)
  - Mobile: Below 768px (Bottom navigation or drawer menu)

## Elevation & Depth
To maintain a professional and clean aesthetic, depth is communicated through **Tonal Layers** rather than heavy shadows.

- **Surface 0 (Background):** #F8FAFC.
- **Surface 1 (Cards/Sidebar):** Pure white (#FFFFFF) with a 1px border (#E2E8F0).
- **Surface 2 (Modals/Drawers):** Pure white with a 12px blur ambient shadow (Opacity 0.05).
- **Interactive States:** Use a subtle 2px inset shadow or a change in background color (Cold Blue) to indicate active or pressed states.

## Shapes
The shape language is **Soft (0.25rem)**. This provides a modern feel while retaining the geometric precision required for an ERP.

- **Inputs & Buttons:** 4px radius.
- **Cards & Modals:** 8px radius.
- **Status Badges:** 2px or fully square to differentiate from interactive buttons.

## Components
Consistent implementation of components ensures speed of use for daily operators.

- **Data Tables (الجداول):** The core of the system. Use sticky headers, alternating row colors (White/Cold Blue), and "Fixed" columns for IDs. Actions are placed in the far left column.
- **Sidebar (القائمة الجانبية):** High contrast (Deep Navy). Active states use a "Cold Blue" right-border indicator.
- **Financial Cards:** Specifically designed to show currency toggles (EGP/USD). Includes a mini-sparkline for price fluctuations.
- **Status Badges (حالة الشحنة):** Use a "Contained-Light" style (e.g., Success Green text on a very pale green background) to avoid visual fatigue.
- **Input Fields:** Labels must be floating or top-aligned for RTL clarity. Use Material Symbols as "End Icons" (placed on the left in RTL) for search or validation.
- **Drawers:** Used for "Quick Entry" of logistics data without losing context of the main dashboard.