# AI Business Factory - PWA Workspace

A shared monorepo workspace for AI-powered Progressive Web Applications that help entrepreneurs discover and develop business opportunities.

## 🚀 Applications

### 📱 **Ideas PWA** - Business Opportunity Discovery
**URL**: https://dc275i5wdcepx.cloudfront.net

Modern dark-mode PWA for discovering curated business opportunities with AI-powered personalization.

**Features:**
- 🌙 **Dark mode by default** with intelligent theme toggle
- ♿ **WCAG 2.2 AA compliant** with excellent accessibility
- 🎨 **Modern UI** with smooth animations and hover effects
- 📊 **Three card types**: Public, Exclusive, and AI-Generated ideas
- 📱 **PWA features**: Installable, offline-capable, theme-aware

**Tech Stack:**
- React 19 + TypeScript
- Tailwind CSS 4 with custom theme system
- Vite 6 for fast development
- Advanced accessibility features

### 🎯 **BMC PWA** - Business Model Canvas
**URL**: https://d1u91xxklexz0v.cloudfront.net

Interactive Business Model Canvas tool with AI assistance and collaborative features.

**Features:**
- 📊 Interactive canvas with drag-and-drop
- 🤖 AI-powered suggestions and validation
- 💾 Real-time collaboration and saving
- 📱 PWA with offline capabilities

## 🏗️ Architecture

### **Shared Workspace Benefits**
- **Code sharing** between applications
- **Consistent UI components** in shared library
- **Unified build and deployment** pipeline
- **Type safety** across all applications

### **Infrastructure**
- **AWS S3 + CloudFront** for global distribution
- **Shared bucket** with path-based separation (`/bmc/`, `/ideas/`)
- **Origin Access Control** for security
- **Automated CI/CD** with GitHub Actions

## 🛠️ Development

### **Prerequisites**
- Node.js 18+
- npm 9+
- AWS CLI (for deployment)

### **Getting Started**
```bash
# Clone the repository
git clone https://github.com/WatchHillAI/ai-business-factory-workspace.git
cd ai-business-factory-workspace

# Install dependencies
npm install

# Start both applications
npm run dev

# Or start individual apps
npm run dev:bmc     # BMC PWA on :3001
npm run dev:ideas   # Ideas PWA on :3002
```

### **Building for Production**
```bash
# Build all applications
npm run build

# Build individual apps
npm run build:bmc-pwa
npm run build:idea-cards-pwa

# Build shared components
npm run build:ui-components
```

## 📦 Workspace Structure

```
ai-business-factory-workspace/
├── apps/
│   ├── bmc-pwa/              # Business Model Canvas PWA
│   └── idea-cards-pwa/       # Ideas Discovery PWA
├── packages/
│   └── ui-components/        # Shared UI component library
├── dist/                     # Build outputs
├── .github/workflows/        # CI/CD pipelines
└── docs/                     # Documentation
```

## 🎨 Design System

### **Dark Mode First**
Both applications feature modern dark themes as the default experience:

- **Rich black backgrounds** (`#0a0a0b`) for premium feel
- **High contrast text** (18.3:1 ratio) exceeding AAA standards
- **Brand colors** optimized for dark backgrounds
- **Smooth theme transitions** with system preference detection

### **Shared Components**
- **Button variants** for different actions and states
- **Card components** with hover effects and branding
- **Badge system** for status and categorization
- **Theme toggle** with animated icons

### **Accessibility**
- **WCAG 2.2 AA compliant** color palette
- **Keyboard navigation** with visible focus indicators
- **Screen reader optimized** with proper ARIA labels
- **Reduced motion** support for accessibility preferences

## 🚀 Deployment

### **Production URLs**
- **BMC PWA**: https://d1u91xxklexz0v.cloudfront.net
- **Ideas PWA**: https://dc275i5wdcepx.cloudfront.net

### **Infrastructure Details**
- **S3 Bucket**: `ai-business-factory-pwa-workspace-dev`
- **CloudFront Distributions**: Dual setup for each PWA
- **Cache Strategy**: Optimized for SPA routing and static assets
- **Security**: HTTPS-only with comprehensive security headers

### **Automated Deployment**
GitHub Actions automatically:
1. Builds both PWA applications
2. Uploads to correct S3 paths
3. Invalidates CloudFront caches
4. Runs health checks

## 📊 Performance

### **Core Web Vitals**
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1
- **PWA Score**: >90 (Lighthouse)

### **Bundle Sizes**
- **BMC PWA**: ~410 KB (compressed)
- **Ideas PWA**: ~230 KB (compressed)
- **Shared Components**: ~50 KB (when used)

## 🧪 Testing

### **Development Testing**
```bash
# Run tests
npm run test

# Lint code
npm run lint

# Type checking
npm run typecheck
```

### **Accessibility Testing**
- **Manual testing** with screen readers
- **Automated testing** with axe-core
- **Contrast validation** for all color combinations
- **Keyboard navigation** verification

## 📚 Documentation

- [PWA Deployment Guide](../ai-business-factory-infrastructure/docs/PWA-DEPLOYMENT-GUIDE.md)
- [Ideas PWA README](./apps/idea-cards-pwa/README.md)
- [Accessibility Report](./apps/idea-cards-pwa/docs/ACCESSIBILITY-REPORT.md)
- [Component Library](./packages/ui-components/README.md)

## 🤝 Contributing

### **Development Workflow**
1. Create feature branch from `main`
2. Implement changes with tests
3. Ensure accessibility compliance
4. Submit pull request with description

### **Code Standards**
- **TypeScript** for type safety
- **ESLint + Prettier** for code quality
- **Conventional commits** for clear history
- **Component documentation** for shared elements

## 🚧 Roadmap

### **Q3 2025**
- [ ] Backend API integration
- [ ] User authentication system
- [ ] Real-time collaboration features
- [ ] Advanced AI recommendations

### **Q4 2025**
- [ ] Multi-tenant architecture
- [ ] Enterprise features
- [ ] Advanced analytics dashboard
- [ ] White-label customization

---

**Built by WatchHill AI** • [Website](https://watchhill.ai) • [Contact](mailto:hello@watchhill.ai)

*Empowering entrepreneurs with AI-driven insights and modern web experiences*