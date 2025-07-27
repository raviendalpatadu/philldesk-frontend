# Navigation System Documentation

## Overview
The PhillDesk pharmacy management system features a comprehensive role-based navigation system that adapts based on user permissions and responsibilities. The navigation is implemented in the `AppLayout.tsx` component and provides intuitive access to all system features.

## Role-Based Navigation Structure

### 🔧 Admin Navigation
Admins have the highest level of access and can manage all aspects of the pharmacy system:

**Main Sections:**
- **Dashboard** - Overview of system metrics and key performance indicators
- **Management** (Submenu)
  - Inventory Management - Stock control and medication tracking
  - User Management - Staff and customer account management (Badge: 2 pending approvals)
- **Analytics & Reports** (Submenu)
  - Reports - Detailed business reports and analytics
  - Analytics Dashboard - Real-time insights and performance metrics
- **System Settings** - Configuration and system administration
- **My Profile** - Personal account settings

**Total Notifications:** 13 (System alerts, pending approvals, inventory warnings)

### 💊 Pharmacist Navigation
Pharmacists have access to prescription management and pharmacy operations:

**Main Sections:**
- **Dashboard** - Personalized pharmacist workspace
- **Prescription Management** (Submenu)
  - All Prescriptions - Complete prescription database
  - Pending Approvals - Prescriptions awaiting verification (Badge: 8 pending)
  - Approved Today - Recently processed prescriptions
- **Inventory** - Medication stock management
- **Billing & Sales** (Submenu)
  - Generate Bills - Create customer invoices
  - Sales History - Transaction records and history
- **My Profile** - Personal account settings

**Total Notifications:** 8 (Pending prescriptions, inventory alerts)

### 👤 Customer Navigation
Customers have streamlined access to their prescriptions and orders:

**Main Sections:**
- **Dashboard** - Personal health and order overview
- **My Prescriptions** (Submenu)
  - All Prescriptions - Complete prescription history
  - Upload New - Submit new prescription documents
  - Pending - Prescriptions in process (Badge: 3 pending)
  - Completed - Fulfilled prescriptions
- **Orders & Billing** (Submenu)
  - Order History - Medication order tracking
  - Billing History - Payment records and invoices
- **My Profile** - Personal account settings

**Total Notifications:** 3 (Order updates, prescription status)

## Key Features

### 🎯 Smart Navigation
- **Active Route Highlighting** - Current page is visually indicated
- **Collapsible Sidebar** - Space-efficient design with toggle functionality
- **Role-Based Filtering** - Only relevant options are displayed
- **Notification Badges** - Real-time counts for pending actions

### 🔔 Notification System
- **Role-Specific Counts** - Different notification types per user role
- **Visual Indicators** - Badge counts on menu items and header
- **Interactive Notifications** - Clickable notification bell in header
- **Context-Aware** - Notifications relate to user's responsibilities

### 🎨 User Experience
- **Consistent Icons** - Ant Design icons throughout the interface
- **Logical Grouping** - Related features are organized in submenus
- **Quick Access** - Frequently used features are prominently placed
- **Professional Design** - Clean, modern interface suitable for healthcare

## Navigation Routing

### Route Structure
```
/admin/*
  ├── /dashboard
  ├── /inventory
  ├── /users
  ├── /reports
  ├── /analytics
  └── /settings

/pharmacist/*
  ├── /dashboard
  ├── /prescriptions
  ├── /inventory
  └── /billing

/customer/*
  ├── /dashboard
  ├── /prescriptions
  ├── /orders
  └── /billing

/profile (All roles)
```

### Protected Routes
- All routes except `/login` and `/register` require authentication
- Role-based access control ensures users only see appropriate content
- Automatic redirection based on user role upon login

## Technical Implementation

### Components
- **AppLayout.tsx** - Main layout with navigation and header
- **ProtectedRoute.tsx** - Route protection based on authentication
- **PublicRoute.tsx** - Redirect authenticated users from auth pages

### State Management
- **AuthStore** - User authentication and role management
- **Navigation State** - Current path tracking and route management

### Styling
- **Ant Design** - Consistent UI component library
- **Custom Styling** - Brand-appropriate colors and spacing
- **Responsive Design** - Works on desktop and mobile devices
