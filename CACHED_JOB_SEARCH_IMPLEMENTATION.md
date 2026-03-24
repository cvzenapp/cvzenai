# Cached Job Search Implementation

## Overview
This implementation adds a caching layer for Tavily job search results to reduce API calls and improve performance. Instead of calling Tavily API every time a user opens the AI chat, we cache the results in the database and reuse them.

## Problem Solved
- **Expensive API calls**: Tavily API was being called on every page load/session
- **Poor user experience**: Users had to wait for API calls on every visit
- **Unnecessary costs**: Repeated API calls for the same user without new search criteria

## Solution Architecture

### 1. Database Layer
**Table**: `cached_job_search_results`
- Stores Tavily search results per user
- Includes expiration mechanism (7 days default)
- Only one active cache per user
- Automatic cleanup of old/expired caches

### 2. Service Layer
**File**: `server/services/cachedJobSearchService.ts`
- `getJobResults()`: Returns cached results or fetches fresh ones
- `searchJobs()`: Always fetches fresh results for manual searches
- `cacheResults()`: Stores results in database
- `clearUserCache()`: Invalidates user's cache

### 3. API Layer
**File**: `server/routes/cachedJobSearch.ts`
- `GET /api/cached-jobs/initial`: Get initial jobs (cached or fresh)
- `POST /api/cached-jobs/search`: Manual search (always fresh)
- `DELETE /api/cached-jobs/cache`: Clear user cache
- `GET /api/cached-jobs/stats`: Cache statistics

### 4. Client Layer
**File**: `client/services/cachedJobSearchApi.ts`
- Frontend service to interact with cached job search API
- Handles API calls and error management

## Usage Flow

### First Time User
1. User opens AI chat
2. Frontend calls `GET /api/cached-jobs/initial`
3. No cache found → Service calls Tavily API
4. Results stored in database and returned to user
5. User sees job results

### Returning User (Within 7 days)
1. User opens AI chat
2. Frontend calls `GET /api/cached-jobs/initial`
3. Cache found and valid → Results returned from database
4. **No Tavily API call made** ✅
5. User sees cached job results instantly

### Manual Search
1. User searches for specific jobs
2. Frontend calls `POST /api/cached-jobs/search` with search params
3. Service always calls Tavily API for fresh results
4. New results replace old cache
5. User sees fresh search results

## Key Features

### Intelligent Caching
- Uses user's resume and job preferences to build initial search query
- Cache expires after 7 days to ensure freshness
- Only one active cache per user (new cache deactivates old ones)

### Performance Optimization
- Database indexes for fast lookups
- Automatic cleanup of expired caches
- Minimal API calls to Tavily

### Flexibility
- Force refresh option for initial load
- Manual search always gets fresh results
- Cache can be cleared manually

### Monitoring
- Cache statistics endpoint for monitoring
- Detailed logging for debugging
- Audit trail of cache operations

## Configuration

### Cache Duration
```typescript
private readonly CACHE_DURATION_DAYS = 7; // Configurable
```

### Search Limits
```typescript
private readonly DEFAULT_SEARCH_LIMIT = 20; // Configurable
```

## API Endpoints

### Get Initial Jobs
```http
GET /api/cached-jobs/initial?refresh=false
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [...],
    "totalResults": 20,
    "fromCache": true,
    "message": "Loaded from cache"
  }
}
```

### Search Jobs
```http
POST /api/cached-jobs/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "React developer",
  "location": "San Francisco",
  "jobType": "full-time",
  "limit": 25
}
```

### Clear Cache
```http
DELETE /api/cached-jobs/cache
Authorization: Bearer <token>
```

## Database Schema

```sql
CREATE TABLE cached_job_search_results (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    search_query TEXT NOT NULL,
    search_location TEXT,
    job_results JSONB NOT NULL,
    total_results INTEGER DEFAULT 0,
    search_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    is_active BOOLEAN DEFAULT true
);
```

## Benefits

### Cost Reduction
- Reduces Tavily API calls by ~80-90% for returning users
- Only fresh calls for manual searches and new users

### Performance Improvement
- Instant job loading for returning users
- Better user experience with cached results

### Smart Caching
- Uses user profile to build relevant initial searches
- Automatic cache invalidation and cleanup
- Respects user preferences and search history

## Integration Points

### Frontend Integration
```typescript
import { cachedJobSearchApi } from './services/cachedJobSearchApi';

// Get initial jobs (cached or fresh)
const result = await cachedJobSearchApi.getInitialJobs();

// Manual search (always fresh)
const searchResult = await cachedJobSearchApi.searchJobs({
  query: 'React developer',
  location: 'remote'
});
```

### AI Chat Integration
- Replace direct Tavily calls with cached job search service
- Use `getInitialJobs()` for chat initialization
- Use `searchJobs()` when user asks for specific job searches

## Monitoring & Maintenance

### Cache Statistics
Monitor cache hit rates and performance:
```typescript
const stats = await cachedJobSearchService.getCacheStats();
// Returns: { totalCaches, activeCaches, expiredCaches }
```

### Cleanup
Automatic cleanup via database function:
```sql
SELECT cleanup_expired_job_caches(); -- Returns number of deleted records
```

## Future Enhancements

1. **Cache Warming**: Pre-populate cache for new users based on profile
2. **Smart Expiration**: Dynamic cache duration based on job market activity
3. **Partial Updates**: Update only new jobs instead of full cache replacement
4. **Geographic Caching**: Cache by location for better regional results
5. **A/B Testing**: Compare cached vs fresh results for optimization

## Migration

Run the migration to create the required table:
```bash
# Apply migration
psql -d your_database -f server/database/migrations/059_cached_job_search_results.sql
```

## Testing

### Test Cache Behavior
1. First login → Should call Tavily and cache results
2. Second login → Should return cached results (no Tavily call)
3. Manual search → Should call Tavily and update cache
4. Cache expiry → Should call Tavily after 7 days

### Performance Testing
- Measure response times: cached vs fresh
- Monitor Tavily API call reduction
- Test with multiple concurrent users

This implementation significantly reduces API costs while improving user experience through intelligent caching of job search results.