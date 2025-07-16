# Claude AI Assistant Notes

## Project Overview
AI Business Factory BMC (Business Model Canvas) Progressive Web App - A mobile-first, offline-capable application for creating and managing business model canvases with AI assistance.

## Development Server Startup Sequence

### ✅ Correct Server Launch Process:

**Important**: The server requires proper timing for successful startup. Follow this exact sequence:

```bash
# 1. Start server in background (critical for stability)
npx vite --port 3001 &

# 2. Wait 2-3 seconds for full initialization
sleep 2

# 3. Verify server is running
curl -I http://localhost:3001
# Should return: HTTP/1.1 200 OK

# 4. Check process is stable
ps aux | grep vite | grep -v grep
```

### ❌ Common Issues:
- **Server appears to start but connection fails**: Process died during initialization
- **Timeout on startup commands**: Normal - server is running but command times out waiting
- **"Cannot connect" after quick start**: Need to allow initialization time

### 🔧 Alternative Startup Methods:
```bash
# Method 1: Background with confirmation
nohup npx vite --port 3001 > vite.log 2>&1 & sleep 3 && curl -I http://localhost:3001

# Method 2: Direct npm script (may be less stable)
npm run dev

# Method 3: Explicit host binding
npx vite --host 0.0.0.0 --port 3001 &
```

## Architecture Notes

### Current Implementation Status:
- ✅ **Offline-first PWA** with IndexedDB persistence
- ✅ **AI Suggestions** - Demo mode (no external API required)
- ✅ **Todo Management** - Local storage per BMC section
- ✅ **Auto-save** - Content persists automatically
- ✅ **Mobile-responsive** - Works across all screen sizes
- ✅ **Completion tracking** - Real-time progress indicators

### API Integration:
- **Current**: Local-only mode with demo AI suggestions
- **Future**: Will connect to AI Business Factory serverless infrastructure
- **Configuration**: Set `VITE_API_URL` environment variable when backend available

### Data Storage:
- **Primary**: IndexedDB via Dexie.js for offline persistence
- **Canvas Data**: Stored with auto-versioning and sync tracking
- **AI Suggestions**: Cached locally with demo fallbacks
- **Todo Lists**: Persisted per BMC section with completion tracking

### Key Files Modified:
- `src/lib/ai-service.ts` - Demo AI suggestions when no API configured
- `src/lib/sync.ts` - Local-only mode for offline operation
- `src/hooks/useCanvas.ts` - Enhanced with AI and todo functionality
- `vite.config.ts` - Removed non-existent API caching rules
- Various component files - Fixed JSX syntax issues

## Testing Checklist:

### Data Persistence:
1. Add content to BMC sections
2. Create todos and mark some complete
3. Request AI suggestions and apply them
4. Refresh browser - verify all data persists
5. Close/reopen browser - verify durability

### PWA Features:
1. Test offline functionality (disconnect internet)
2. Check PWA installation prompt
3. Verify service worker operation
4. Test mobile responsiveness

## Commands Reference:

```bash
# Start development server (recommended)
npx vite --port 3001 &

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install

# TypeScript check
npx tsc --noEmit
```