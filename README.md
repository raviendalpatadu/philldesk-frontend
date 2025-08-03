# PhillDesk Frontend

A modern, scalable React frontend for the PhillDesk Pharmacy Management System built with TypeScript, Ant Design, and Vite.

## 🏥 Project Overview

PhillDesk is a comprehensive pharmacy management system designed to automate core operations for small and medium-scale pharmacies. The frontend provides:

- **Role-based dashboards** for Admin, Pharmacist, and Customer users
- **Prescription management** with secure file upload and approval workflows
- **Inventory tracking** with real-time stock alerts and expiry notifications
- **Billing system** with automated invoice generation
- **Reports and analytics** for business insights
- **Responsive design** optimized for desktop and mobile browsers

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication with role-based access control
- Secure login/logout with token management
- Protected routes based on user roles

### Role-Specific Features

#### Admin Dashboard
- System overview with key metrics
- User management and role assignment
- Inventory management with stock alerts
- Comprehensive reporting and analytics
- System settings and configuration

#### Pharmacist Dashboard
- Prescription review and approval
- Inventory management and stock updates
- Billing and invoice generation
- Daily activity tracking

#### Customer Dashboard
- Prescription upload (PDF/Image support)
- Order history and status tracking
- Purchase history and billing

### Technical Features
- **Modern React 18** with functional components and hooks
- **TypeScript** for type safety and better development experience
- **Ant Design** for consistent and professional UI components
- **Zustand** for lightweight state management
- **React Query** for server state management and caching
- **React Router** for client-side routing
- **Axios** for HTTP requests with interceptors
- **Vite** for fast development and optimized builds

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend Framework** | React 18 + TypeScript | Core application framework |
| **Build Tool** | Vite | Fast development and optimized builds |
| **UI Library** | Ant Design | Professional React components |
| **State Management** | Zustand | Lightweight global state |
| **Server State** | React Query | API data fetching and caching |
| **Routing** | React Router v6 | Client-side navigation |
| **HTTP Client** | Axios | API communication |
| **Styling** | CSS + Ant Design | Component styling |
| **Icons** | Ant Design Icons | Consistent iconography |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16.0 or higher)
- **npm** (version 8.0 or higher) or **yarn**
- **Git** for version control

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd philldesk-frontend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api

# Application Configuration
VITE_APP_NAME=PhillDesk
VITE_APP_VERSION=1.0.0
```
### 4. Start Development Server

```bash
npm run dev
```

The application will be available at \`http://localhost:3000\`

### 5. Build for Production

```bash
npm run build
# or
yarn build
```

### 6. Preview Production Build

```bash
npm run preview
# or
yarn preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication-related components
│   ├── common/         # Shared components
│   └── layout/         # Layout components
├── pages/              # Page components
│   ├── admin/          # Admin-specific pages
│   ├── auth/           # Authentication pages
│   ├── customer/       # Customer-specific pages
│   ├── pharmacist/     # Pharmacist-specific pages
│   ├── common/         # Shared pages
│   └── error/          # Error pages
├── services/           # API service functions
├── store/              # State management (Zustand stores)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
├── config/             # Configuration files
├── assets/             # Static assets
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## 🔐 Authentication

The application uses JWT-based authentication with role-based access control:

### Demo Credentials

For testing purposes, you can use these demo credentials:

| Role | username | Password |
|------|-------|----------|
| **Admin** | admin | password123 |
| **Pharmacist** | pharmacist | password123 |
| **Customer** | customer | password123 |

### User Roles & Permissions

- **Admin**: Full system access including user management, reports, and settings
- **Pharmacist**: Prescription management, inventory control, and billing
- **Customer**: Prescription upload and order tracking

## 🧪 Development Guidelines

### Code Standards
- Use TypeScript for all new components
- Follow functional component patterns with hooks
- Implement proper error handling and loading states
- Add comprehensive JSDoc comments for functions
- Use consistent naming conventions (camelCase for variables, PascalCase for components)

### Component Guidelines
- Keep components small and focused on single responsibility
- Use custom hooks for reusable logic
- Implement proper prop validation with TypeScript
- Follow Ant Design component patterns and guidelines

### State Management
- Use Zustand for global application state
- Use React Query for server state management
- Keep local state in components when appropriate
- Implement proper loading and error states

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| \`npm run dev\` | Start development server |
| \`npm run build\` | Build for production |
| \`npm run preview\` | Preview production build |
| \`npm run lint\` | Run ESLint for code quality |
| \`npm run type-check\` | Run TypeScript type checking |

## 🎨 UI/UX Guidelines

### Design Principles
- **Consistency**: Use Ant Design components consistently
- **Accessibility**: Ensure proper ARIA labels and keyboard navigation
- **Responsiveness**: Design mobile-first, desktop-enhanced
- **Performance**: Lazy load components and optimize bundle size

### Color Scheme
- **Primary**: \`#1890ff\` (Ant Design Blue)
- **Success**: \`#52c41a\` (Green)
- **Warning**: \`#faad14\` (Orange)
- **Error**: \`#ff4d4f\` (Red)
- **Background**: \`#f0f2f5\` (Light Gray)

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: 1200px and above
- **Tablet**: 768px to 1199px
- **Mobile**: Below 768px

## 🔍 Testing

### Manual Testing Checklist
- [ ] Authentication flow (login/logout)
- [ ] Role-based access control
- [ ] Responsive design on different screen sizes
- [ ] Form validation and error handling
- [ ] File upload functionality
- [ ] Navigation and routing

## 🚀 Deployment

### Build Optimization
The production build includes:
- Code splitting and lazy loading
- Asset optimization and compression
- Source map generation
- Environment-specific configurations

### Deployment Options
- **Netlify**: \`npm  run build && netlify deploy --prod\`
- **Vercel**: \`vercel --prod\`
- **GitHub Pages**: Using GitHub Actions
- **Traditional Hosting**: Upload \`dist/\` folder

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/new-feature\`)
3. Commit your changes (\`git commit -m 'Add new feature'\`)
4. Push to the branch (\`git push origin feature/new-feature\`)
5. Open a Pull Request


## 🆘 Support & Contact

For support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

### Planned Features
- [ ] Real-time notifications with WebSocket
- [ ] PWA support for offline functionality
- [ ] Advanced reporting with charts and graphs
- [ ] Multi-language support (i18n)
- [ ] Dark mode theme
- [ ] Mobile app version
- [ ] Integration with payment gateways
- [ ] SMS/Email notification system

### Technical Improvements
- [ ] Unit and integration testing
- [ ] E2E testing with Cypress
- [ ] Performance monitoring
- [ ] Error tracking and logging
- [ ] Automated CI/CD pipeline
- [ ] Docker containerization


