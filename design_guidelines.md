# CRM Design Guidelines: Towing Services Management System

## Design Approach

**Selected System:** Modern SaaS Dashboard (Linear/Notion-inspired)
**Justification:** This is a utility-focused, information-dense business application requiring efficiency, data clarity, and professional presentation. The design prioritizes rapid data entry for drivers in the field and comprehensive reporting for admins at desks.

## Core Design Elements

### Typography
- **Primary Font:** Inter (Google Fonts) - optimized for screens and data-heavy interfaces
- **Headings:** 
  - H1: 2xl (1.5rem), font-semibold - page titles
  - H2: xl (1.25rem), font-semibold - section headers
  - H3: lg (1.125rem), font-medium - card/panel titles
- **Body Text:** base (1rem), font-normal - forms, tables, descriptions
- **Supporting Text:** sm (0.875rem), font-normal - labels, metadata, timestamps
- **Micro Text:** xs (0.75rem), font-normal - table headers, badges, helper text

### Layout System
**Spacing Units:** Tailwind units of 3, 4, 6, 8, 12 for consistent rhythm
- Component padding: p-6
- Section gaps: space-y-6 or gap-6
- Card padding: p-6
- Form field spacing: space-y-4
- Table cell padding: px-4 py-3
- Page margins: Responsive containers (max-w-7xl mx-auto px-4)

**Grid Patterns:**
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Form layouts: Single column on mobile, two-column on desktop (lg:grid-cols-2)
- Data tables: Full-width with horizontal scroll on mobile

### Component Library

**Navigation**
- Top navigation bar with logo, user profile dropdown (role badge visible), logout
- Sidebar navigation for admin view: collapsible on mobile, fixed on desktop
- Breadcrumbs for deep navigation paths

**Forms & Inputs**
- Full-width inputs with clear labels above
- Floating labels for compact mobile forms
- Validation states: success/error borders with inline messages
- Date/time pickers: native HTML5 inputs styled consistently
- Dropdowns: searchable select for client selection with type-ahead
- Auto-save indicators for draft reports

**Data Display**
- **Tables:** Striped rows, sortable headers with arrow indicators, sticky header on scroll, row hover states, inline action buttons (edit/delete icons)
- **Cards:** Rounded corners (rounded-lg), subtle border, white background, organized information hierarchy
- **Stats Cards:** Large metric number (text-3xl font-bold), label below (text-sm), trend indicator icon
- **Status Badges:** Rounded-full px-3 py-1 text-xs - distinct visual treatment for Draft/Submitted/Approved states
- **Calendar View:** Month grid for trip history, clickable dates with trip count indicators

**Dashboards**
- **Driver Dashboard:** 
  - Quick stats row (trips today, this week, total km)
  - Trip entry form prominently placed
  - Recent trips list with date filters
  - Calendar view toggle
- **Admin Dashboard:**
  - Analytics summary cards (4-column grid: total km, revenue, active drivers, pending reports)
  - Filter panel: collapsible on mobile, sidebar on desktop
  - Export buttons (Excel/PDF) with icon + label
  - Data table with pagination, batch actions

**Modals & Overlays**
- Centered modal with backdrop blur
- Confirmation dialogs for destructive actions (delete, reject)
- Toast notifications (top-right): success/error/info states with auto-dismiss

**Buttons**
- Primary: Full rounded (rounded-md), medium padding (px-6 py-2.5), font-medium
- Secondary: Same size, outlined style
- Icon buttons: Square (w-10 h-10), centered icon, subtle hover state
- Button groups for related actions (Edit/Delete, Approve/Reject)

**Empty States**
- Centered icon (text-5xl opacity-20)
- Heading and descriptive text
- Primary action button

### Mobile Optimization
- **Driver Forms:** Single-column layout, large touch targets (min-h-12), sticky submit button at bottom
- **Tables:** Card-based layout on mobile (stacked key-value pairs), horizontal scroll for admin tables
- **Navigation:** Hamburger menu with slide-out drawer
- **Filters:** Bottom sheet on mobile, sidebar on desktop

### Responsive Breakpoints
- Mobile: base (< 768px) - single column, stacked components
- Tablet: md (768px+) - two-column grids, expanded navigation
- Desktop: lg (1024px+) - full multi-column layouts, sidebar navigation
- Wide: xl (1280px+) - max container width, more breathing room

### Accessibility
- Focus rings on all interactive elements (ring-2 ring-offset-2)
- Sufficient contrast ratios for all text
- ARIA labels for icon-only buttons
- Keyboard navigation support for tables and modals
- Screen reader announcements for dynamic content (form validation, toast messages)

### Images
No images required for this business application. Icons only via Heroicons (outline style for navigation, solid for buttons/actions).