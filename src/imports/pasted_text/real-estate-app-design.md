Design a complete web application UI/UX for a real estate transaction management platform. The app is used by an estate agency consultancy to track property sale/rental transactions from agreement to completion, and to automatically calculate and display commission splits between the company and agents.
Design Philosophy

Tone: Refined luxury minimalism — think a premium fintech dashboard meets high-end real estate branding. Clean, spacious, confident.
Differentiator: A bold accent color palette (deep navy #0A1628 as primary dark, warm amber/gold #D4A853 as accent, crisp white #FAFBFC for backgrounds, and a secondary cool slate #64748B for muted text). This palette conveys trust, professionalism, and premium quality — internationally recognizable and culturally neutral.
Typography: Use "Satoshi" or "General Sans" for headings (geometric, modern, distinctive), paired with "DM Sans" for body text (clean readability). Avoid Inter, Roboto, Arial.
Layout principle: Generous whitespace, card-based sections with subtle shadows (box-shadow: 0 1px 3px rgba(0,0,0,0.06)), asymmetric grid compositions where needed. Sidebar navigation on desktop, bottom tab bar on mobile.

Pages & Components Required
1. Dashboard (Home)

Top stats row: 4 metric cards showing Total Transactions, Active Transactions, Total Revenue, Pending Commissions — each with a small sparkline or trend indicator.
A horizontal pipeline/kanban view of transactions across 4 stages: Agreement → Earnest Money → Title Deed → Completed. Each stage is a column with transaction cards inside. Cards show property name, transaction value, assigned agents, and a colored stage badge.
Recent activity feed on the right sidebar (timeline-style, showing stage transitions and financial events).
A "Quick Actions" floating button or section for creating new transactions.

2. Transaction Detail Page

Top section: Property info card (address, type, transaction value) with a prominent horizontal stepper/progress bar showing the 4 stages. The current stage is highlighted in amber/gold, completed stages in green, upcoming stages in muted gray.
A "Transition Stage" button that advances the transaction to the next valid stage with a confirmation modal.
Financial Breakdown panel: A clear visual split showing Company Share (50%), Agent Share (50%), and within the agent share, the listing agent and selling agent portions (either 50/50 or 100/0 depending on scenario). Use a donut chart or proportional bar for visual clarity.
Agent assignment section showing avatars, names, roles (Listing Agent / Selling Agent), and their individual earnings.
Activity log / timeline at the bottom showing all stage transitions with timestamps.

3. Transactions List Page

A sortable, filterable data table with columns: Property, Transaction Value, Stage (badge), Listing Agent, Selling Agent, Commission, Date.
Filter bar at top: filter by stage, agent, date range.
Each row is clickable to navigate to the Transaction Detail page.
Empty state illustration when no transactions match filters.

4. Agents Page

Agent directory in a grid of cards: avatar, name, total transactions, total earnings.
Click into an agent detail view showing their transaction history, commission earnings over time (line chart), and role distribution (pie chart of listing vs selling agent assignments).

5. Financial Reports Page

Period selector (monthly/quarterly/yearly).
Summary cards: Total Commission Earned, Agency Share, Total Agent Payouts.
A stacked bar chart showing commission breakdown per month (agency vs agent portions).
A table of completed transactions with full financial breakdown per row.

6. Create/Edit Transaction Modal or Page

Clean form with fields: Property Address, Property Type (sale/rental), Transaction Value (total service fee), Listing Agent (dropdown), Selling Agent (dropdown).
Real-time commission preview: as the user fills in the form, show a live calculation panel on the right side displaying how the commission will be split (company 50%, agents based on same/different scenario).
Validation with inline error messages.

7. Login Page

Centered card on a full-bleed dark navy background.
Company logo at top, email + password fields, gold accent CTA button.
Subtle animated gradient or grain texture on the background for depth.

Component Library (Reusable)

Stage Badge: Pill-shaped, color-coded per stage (Agreement = blue, Earnest Money = amber, Title Deed = purple, Completed = green).
Metric Card: Value, label, trend arrow with percentage, optional sparkline.
Agent Avatar Chip: Small circular avatar + name, used inline in tables and cards.
Progress Stepper: Horizontal 4-step indicator with connecting lines, responsive.
Commission Split Visualizer: Proportional bar or donut chart component showing agency vs agent(s) split.
Confirmation Modal: For stage transitions, with summary of what will change.
Toast Notifications: Success/error/info, slides in from top-right.
Empty State: Illustration + message + CTA for when lists are empty.

Responsive Behavior

Desktop: Sidebar navigation (collapsible), 12-column grid content area.
Tablet: Sidebar collapses to icons, content adapts to fewer columns.
Mobile: Bottom tab navigation, single column layout, cards stack vertically, tables become card-based lists.

Micro-interactions & Motion

Stage transition animation: when a transaction advances, the stepper animates with a smooth fill effect.
Card hover: subtle lift (translateY -2px) with shadow increase.
Number counters on dashboard animate on page load (count-up effect).
Skeleton loading states for all data-dependent sections.
Page transitions: subtle fade + slide.

Internationalization Readiness

All text should be placeholder-ready for i18n (no hardcoded cultural references).
Currency formats should use a generic symbol or configurable format (€, $, £).
Date formats in ISO-friendly display (DD MMM YYYY).
RTL-compatible layout structure (use logical CSS properties: margin-inline, padding-block, etc.).

Accessibility

WCAG 2.1 AA contrast ratios on all text.
Focus-visible states on all interactive elements.
Aria labels on icon-only buttons.
Keyboard navigable stage transitions and modals.