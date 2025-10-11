# Development Setup Guide

This guide explains how to run the application in development mode with hot-reload enabled.

## Quick Start

### For Windows Users:

```cmd
# 1. Build development containers
start.bat dev build

# 2. Start with hot-reload
start.bat dev up -d

# 3. View logs
start.bat dev logs -f
```

### For Linux/Mac Users:

```bash
# 1. Make script executable (first time only)
chmod +x start.sh

# 2. Build development containers
./start.sh dev build

# 3. Start with hot-reload
./start.sh dev up -d

# 4. View logs
./start.sh dev logs -f
```

## What's Different in Development Mode?

### ✅ Hot-Reload Enabled

**Frontend (Vue.js + Vite):**
- Edit any file in `frontend/src/` - changes appear instantly in browser
- No rebuild required
- Hot Module Replacement (HMR) enabled
- Access at: http://localhost:3000

**Backend (Spring Boot):**
- Edit any `.java` file in `backend/src/` - application auto-restarts
- Spring Boot DevTools detects changes
- Typically restarts in 2-3 seconds
- Debug port available on 5005
- Access at: http://localhost:8080

### 📁 Volume Mounts

Development mode mounts your local source code into the containers:

**Frontend:**
- `./frontend/src` → `/app/src`
- `./frontend/public` → `/app/public`
- Configuration files (vite.config.ts, tsconfig.json, etc.)

**Backend:**
- `./backend/src` → `/app/src`
- `./backend/pom.xml` → `/app/pom.xml`

**Result:** Changes to these files are immediately visible inside the container.

### 🔧 Development vs Production

| Feature | Development Mode | Production Mode |
|---------|-----------------|-----------------|
| Hot-reload | ✅ Yes | ❌ No |
| File watching | ✅ Enabled | ❌ Disabled |
| Build time | ⚡ Fast (first time only) | 🐢 Slower (optimized build) |
| Image size | 📦 Larger | 📦 Smaller |
| Debugging | ✅ Port 5005 open | ❌ Not available |
| Best for | Development & testing | Deployment |

## Common Commands

### View Running Containers
```bash
docker ps
```

### Check Container Logs
```bash
# All services
start.bat dev logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Restart Services
```bash
# Restart all
start.bat dev restart

# Restart specific service
docker-compose -f docker-compose.dev.yml restart frontend
```

### Stop and Remove Containers
```bash
start.bat dev down
```

### Rebuild After Dependency Changes
```bash
# If you modify package.json or pom.xml
start.bat dev build --no-cache
start.bat dev up -d
```

## Troubleshooting

### Changes Not Reflecting?

**Frontend:**
1. Check browser console for errors
2. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. Check container logs: `docker-compose -f docker-compose.dev.yml logs -f frontend`

**Backend:**
1. Check if auto-restart triggered in logs
2. May take 2-3 seconds to restart
3. Check for compilation errors in logs

### Port Already in Use

```bash
# Stop containers
start.bat dev down

# Or manually kill processes using ports 3000, 5173, or 8080
```

### Containers Not Starting

```bash
# View full logs
start.bat dev logs

# Rebuild from scratch
start.bat dev down
start.bat dev build --no-cache
start.bat dev up -d
```

### Node Modules or Maven Dependencies Issues

```bash
# Remove volumes and rebuild
docker-compose -f docker-compose.dev.yml down -v
start.bat dev build --no-cache
start.bat dev up -d
```

## Debugging

### Backend Debugging (IntelliJ IDEA / VS Code)

The backend exposes debug port **5005**.

**IntelliJ IDEA:**
1. Run → Edit Configurations → Add New → Remote JVM Debug
2. Host: `localhost`, Port: `5005`
3. Click Debug

**VS Code:**
Add to `.vscode/launch.json`:
```json
{
  "type": "java",
  "name": "Attach to Backend",
  "request": "attach",
  "hostName": "localhost",
  "port": 5005
}
```

### Frontend Debugging

Use browser DevTools (F12) - Vue DevTools extension recommended.

## Switching Between Modes

### From Development to Production
```bash
# Stop dev containers
start.bat dev down

# Start production
start.bat prod build
start.bat prod up -d
```

### From Production to Development
```bash
# Stop production containers
start.bat prod down

# Start dev containers
start.bat dev up -d
```

## Best Practices

1. **Use development mode** for daily coding
2. **Test in production mode** before deploying
3. **Commit often** - hot-reload doesn't save your work
4. **Watch the logs** - errors appear there first
5. **Restart containers** if behavior seems odd

## Performance Tips

- Keep `node_modules` and `.m2` as Docker volumes (already configured)
- Don't mount these directories from host - causes slowness
- Use `.dockerignore` to exclude unnecessary files
- Consider increasing Docker memory allocation if containers are slow

## Need Help?

Check the logs first:
```bash
start.bat dev logs -f
```

If issues persist, try a clean rebuild:
```bash
start.bat dev down -v
start.bat dev build --no-cache
start.bat dev up -d
```
