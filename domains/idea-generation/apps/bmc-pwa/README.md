# AI Business Factory - BMC PWA

A mobile-first Progressive Web App for creating and elaborating Business Model Canvases with AI assistance.

## 🚀 Features

### 📱 Mobile-First Design
- **Responsive Layout**: Adapts from mobile (single column) → tablet (2 columns) → desktop (traditional BMC grid)
- **Touch-Optimized**: Large touch targets, smooth gestures, haptic feedback
- **Progressive Web App**: Install on home screen, offline support, push notifications

### 🎯 Business Model Canvas
- **9 BMC Sections**: All standard BMC components with guided completion
- **Smart Completion Tracking**: Real-time progress with color-coded indicators
- **AI-Powered Suggestions**: Context-aware recommendations for each section
- **Action Items**: Todo lists for each section to track progress

### 🤖 AI Integration
- **Multi-Model Routing**: Claude, OpenAI, Gemini with cost optimization
- **Smart Caching**: Reduce AI costs by 60-80% with intelligent response caching
- **Progressive Enhancement**: Basic suggestions → detailed analysis → strategic insights

### 💾 Offline-First Architecture
- **IndexedDB Storage**: Full offline functionality with automatic sync
- **Service Worker**: Background sync, caching, and updates
- **Conflict Resolution**: Handle online/offline data conflicts gracefully

## 🛠️ Technical Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive design
- **Framer Motion** for smooth animations
- **Radix UI** for accessible components

### PWA Features
- **Workbox** for service worker management
- **IndexedDB** with Dexie.js for offline storage
- **Push Notifications** for real-time updates
- **App Install Prompts** for native-like experience

### Backend Integration
- **AWS S3** for markdown file storage
- **AWS Lambda** for serverless functions
- **DynamoDB** for metadata and indexing
- **REST API** for simple mobile integration

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-business-factory-bmc-pwa

# Install dependencies
npm install

# Start development server (IMPORTANT: Follow correct startup sequence)
# Method 1 (Recommended): Background startup with timing
npx vite --port 3001 &
sleep 2  # Allow 2-3 seconds for full initialization
curl -I http://localhost:3001  # Verify server is responding

# Method 2 (Alternative): npm script (may be less stable)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Development

### Project Structure
```
src/
├── components/
│   ├── bmc/           # BMC-specific components
│   ├── ui/            # Reusable UI components
│   └── layout/        # Layout components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── stores/            # State management
├── types/             # TypeScript definitions
└── styles/            # Global styles
```

### Key Components
- **BMCCanvas**: Main canvas component with responsive layout
- **BMCBox**: Individual canvas sections with completion tracking
- **FAB**: Floating Action Button with progress indicator
- **MobileNav**: Mobile-specific navigation panel

### Development Commands
```bash
# Start development server (CRITICAL: Use correct timing)
npx vite --port 3001 &  # Background startup for stability
sleep 2                 # REQUIRED: Allow initialization time  
curl -I http://localhost:3001  # Verify server responds with HTTP 200

# Alternative methods
npm run dev             # Less stable, may timeout
npx vite --host 0.0.0.0 --port 3001 &  # Explicit host binding

# Other commands
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript checks
npm test                # Run tests

# Troubleshooting
ps aux | grep vite | grep -v grep  # Check if vite process is running
pkill -f "vite"         # Kill stuck vite processes
```

### 🚨 Server Startup Notes
- **Background startup (`&`) is critical** - prevents process blocking
- **2-3 second wait is required** - allows full initialization
- **Server may appear ready but crash** - always verify with curl test
- **Process timing matters** - don't skip the sleep command

## 📱 PWA Features

### Installation
- **Add to Home Screen**: Install as native app on mobile devices
- **Desktop Installation**: Install via browser on desktop
- **Automatic Updates**: Background updates with user notification

### Offline Support
- **Full Offline Mode**: Create and edit canvases without internet
- **Background Sync**: Automatic sync when connection restored
- **Cached AI Responses**: Reuse previous AI suggestions offline

### Performance
- **Service Worker Caching**: Fast loading with aggressive caching
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Responsive images with modern formats

## 🎨 Design System

### Responsive Breakpoints
- **Mobile**: < 768px (single column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (traditional BMC grid)

### Color System
- **Completion Levels**: Red (0-25%) → Orange (25-50%) → Yellow (50-75%) → Green (75-100%)
- **Brand Colors**: Primary blue (#1e40af), with semantic colors for status

### Typography
- **Mobile-First**: Larger text on mobile to prevent zoom
- **Accessible**: High contrast ratios and readable fonts
- **Responsive**: Scales appropriately across devices

## 🔒 Security & Privacy

### Data Protection
- **Local Storage**: Sensitive data stored locally in IndexedDB
- **Encryption**: Canvas data encrypted before cloud sync
- **Privacy Controls**: Optional anonymous mode

### Authentication
- **JWT Tokens**: Secure authentication with automatic refresh
- **Session Management**: Secure session handling
- **Permission Controls**: Granular access controls

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### PWA Optimization
- **Manifest**: Configure app metadata and icons
- **Service Worker**: Cache strategies and offline support
- **Performance**: Lighthouse score optimization

### Hosting
- **Static Hosting**: Can be deployed to any static host
- **CDN**: Optimized for CDN deployment
- **Edge Computing**: Service worker runs at edge locations

## 📊 Analytics & Monitoring

### Performance Metrics
- **Core Web Vitals**: LCP, FID, CLS monitoring
- **PWA Metrics**: Install rate, engagement, retention
- **Error Tracking**: Real-time error monitoring

### User Analytics
- **Canvas Completion**: Track completion rates by section
- **AI Usage**: Monitor AI suggestion usage and effectiveness
- **Feature Adoption**: Track feature usage patterns

## 🔄 Sync & Collaboration

### Data Synchronization
- **Conflict Resolution**: Automatic and manual conflict resolution
- **Version Control**: Canvas versioning with rollback
- **Collaborative Editing**: Real-time collaboration features

### Export Options
- **PDF Export**: Professional business plan format
- **Image Export**: Canvas as PNG/SVG
- **Data Export**: JSON/CSV for analysis

## 🎯 Future Enhancements

### Planned Features
- **Voice Input**: Voice-to-text for mobile editing
- **Collaboration**: Real-time multi-user editing
- **Templates**: Industry-specific canvas templates
- **Analytics**: Advanced completion analytics

### Technical Roadmap
- **WebAssembly**: Performance-critical operations
- **WebRTC**: Direct peer-to-peer collaboration
- **ML Models**: On-device AI processing
- **AR/VR**: Immersive canvas experience

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting pull requests.

## 📞 Support

For support and questions:
- 📧 Email: support@aibusinessfactory.com
- 📱 In-app feedback system
- 🐛 GitHub Issues for bug reports