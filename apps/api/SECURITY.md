# Security Features - Maintenance System V3 API

## Overview
This document outlines all security features implemented in the Maintenance System V3 API.

## Authentication & Authorization

### 1. OTP Brute Force Protection
**Location**: `src/common/guards/security-throttler.guard.ts`

**Features**:
- **IP-based rate limiting**: Blocks IPs after 10 failed attempts within 1 hour
- **Account lockout**: Locks accounts after 10 failed login attempts for 30 minutes
- **Automatic unblock**: Lockouts expire automatically after cooldown period

**Configuration**:
```typescript
MAX_FAILED_ATTEMPTS = 10
LOCKOUT_DURATION = 30 minutes
IP_BAN_DURATION = 1 hour
```

**Usage**:
```typescript
// Applied globally via APP_GUARD or per-route
@UseGuards(SecurityThrottlerGuard)
```

### 2. Session Management
**Location**: `src/modules/auth/services/session-manager.service.ts`

**Features**:
- **Max sessions limit**: 5 active sessions per user
- **Device fingerprinting**: Tracks device info (user agent, IP, platform, browser)
- **Auto-logout**: Automatically revokes oldest session when limit is reached
- **Session monitoring**: View and manage all active sessions

**Usage**:
```typescript
// Create new session with device tracking
await sessionManager.createSession(userId, refreshToken, deviceInfo);

// Get all active sessions
const sessions = await sessionManager.getActiveSessions(userId);

// Revoke specific session
await sessionManager.revokeSession(userId, sessionId);

// Revoke all other sessions
await sessionManager.revokeAllOtherSessions(userId, currentToken);
```

## File Security

### File Upload Security
**Location**: `src/common/interceptors/file-security.interceptor.ts`

**Features**:
- **Extension whitelist**: Only allows safe file types
- **MIME type validation**: Validates actual file content matches extension
- **File size limits**: Max 10MB per file
- **Secure file names**: Generates cryptographically secure random filenames
- **Upload limits**: Max 10 files per request

**Allowed file types**:
```
Images: .jpg, .jpeg, .png, .gif, .webp
Documents: .pdf, .doc, .docx
```

**Usage**:
```typescript
// Apply to file upload endpoints
@UseInterceptors(FileSecurityInterceptor)
@Post('upload')
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // file.filename is now a secure random name
  // file.originalFilename contains original name
}
```

## HTTP Security

### Helmet.js Protection
**Location**: `src/main.ts`

**Features**:
- **Content Security Policy (CSP)**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME-sniffing
- **Strict-Transport-Security**: Enforces HTTPS
- **X-DNS-Prefetch-Control**: Controls DNS prefetching

**Configuration**:
```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
})
```

### Rate Limiting
**Location**: `src/modules/auth/auth.controller.ts`

**Endpoints protected**:
```typescript
// Staff login: 5 attempts per 5 minutes
@Throttle({ login: { limit: 5, ttl: 300000 } })

// OTP request: 3 attempts per minute
@Throttle({ login: { limit: 3, ttl: 60000 } })

// OTP verify: 5 attempts per 5 minutes
@Throttle({ login: { limit: 5, ttl: 300000 } })
```

## Caching & Performance

### Redis Caching Layer
**Location**: `src/common/services/cache.service.ts`

**Features**:
- **Query result caching**: Cache expensive database queries
- **TTL support**: Automatic cache expiration
- **Pattern-based invalidation**: Invalidate related cache keys
- **Get-or-set pattern**: Automatic cache population

**Usage**:
```typescript
// Basic caching
await cache.set('key', data, 300); // 5 minutes
const data = await cache.get<Type>('key');

// Get or set pattern
const data = await cache.getOrSet(
  'tickets:list',
  async () => await this.prisma.ticket.findMany(),
  300,
);

// Pattern invalidation
await cache.delPattern('tickets:*');
```

**Configuration**:
```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_CACHE_DB=1
```

## Security Best Practices

### 1. Input Validation
- All inputs validated using `class-validator`
- Whitelist mode enabled (strips unknown properties)
- Transform and sanitize inputs automatically

### 2. Password Security
- Passwords hashed with bcrypt (10 salt rounds)
- No password stored in plain text
- Password comparison using constant-time algorithm

### 3. JWT Token Security
- Short-lived access tokens (15 minutes)
- Refresh tokens with rotation
- Tokens stored securely in HttpOnly cookies (recommended)

### 4. Database Security
- Parameterized queries via Prisma (prevents SQL injection)
- Soft deletes for data retention
- Audit logging for sensitive operations

### 5. API Security Checklist
- ✅ Authentication required for all protected endpoints
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting on auth endpoints
- ✅ CORS configured with specific origins
- ✅ Helmet.js for HTTP headers
- ✅ Input validation and sanitization
- ✅ File upload restrictions
- ✅ Session management and limits
- ✅ Error messages don't leak sensitive info

## Monitoring & Logging

### Security Events to Monitor
- Failed login attempts (IP, user, timestamp)
- Account lockouts
- Session creation/revocation
- File uploads
- API rate limit violations

### Recommended Tools
- **Sentry**: Error tracking and monitoring
- **ELK Stack**: Log aggregation and analysis
- **Prometheus + Grafana**: Metrics and alerting

## Production Deployment

### Environment Variables
```env
# Security
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
BCRYPT_ROUNDS=10

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
THROTTLE_LOGIN_TTL=300
THROTTLE_LOGIN_LIMIT=5

# Redis
REDIS_ENABLED=true
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_CACHE_DB=1

# CORS
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Node Environment
NODE_ENV=production
```

### SSL/TLS
- Always use HTTPS in production
- Configure SSL certificates
- Redirect HTTP to HTTPS
- Use HSTS header (enabled via Helmet)

### Regular Updates
- Keep dependencies up to date
- Monitor security advisories
- Run `npm audit` regularly
- Apply security patches promptly

## Incident Response

### In case of security incident:
1. **Immediate**: Revoke all active sessions
2. **Investigate**: Check logs for breach scope
3. **Notify**: Inform affected users
4. **Fix**: Patch vulnerability
5. **Monitor**: Watch for suspicious activity

### Emergency Session Revocation
```typescript
// Revoke all sessions for compromised user
const sessions = await sessionManager.getActiveSessions(userId);
for (const session of sessions) {
  await sessionManager.revokeSession(userId, session.id);
}
```

## Security Contacts

For security issues, please report to:
- Security Team: security@yourcompany.com
- Do not open public issues for security vulnerabilities

## License
Confidential - Internal Use Only
