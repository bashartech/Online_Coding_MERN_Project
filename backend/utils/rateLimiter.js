// Simple in-memory rate limiter for socket events
// In production, this would use Redis or a database for distributed rate limiting

const rateLimits = new Map(); // Maps userId: { timestamp, count }

/**
 * Check if a user is within their rate limit for a specific event
 * @param {string} userId - The user ID
 * @param {string} eventType - The event type (e.g., 'code-change')
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} Whether the user is within their rate limit
 */
export const isRateLimited = (userId, eventType, maxRequests = 10, windowMs = 1000) => {
  const key = `${userId}:${eventType}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimits.has(key)) {
    // First request in this window
    rateLimits.set(key, {
      timestamp: now,
      count: 1
    });
    return false;
  }

  const limitInfo = rateLimits.get(key);

  // If the time window has passed, reset the counter
  if (limitInfo.timestamp < windowStart) {
    rateLimits.set(key, {
      timestamp: now,
      count: 1
    });
    return false;
  }

  // Check if we've exceeded the limit
  if (limitInfo.count >= maxRequests) {
    return true; // Rate limited
  }

  // Increment the counter
  rateLimits.set(key, {
    timestamp: now,
    count: limitInfo.count + 1
  });

  return false; // Not rate limited
};

/**
 * Reset rate limit for a user and event type
 * @param {string} userId - The user ID
 * @param {string} eventType - The event type
 */
export const resetRateLimit = (userId, eventType) => {
  const key = `${userId}:${eventType}`;
  rateLimits.delete(key);
};

/**
 * Cleanup expired rate limits (call periodically)
 */
export const cleanupExpiredLimits = () => {
  const now = Date.now();
  const windowMs = 60000; // 1 minute window for cleanup

  for (const [key, limitInfo] of rateLimits.entries()) {
    if (now - limitInfo.timestamp > windowMs) {
      rateLimits.delete(key);
    }
  }
};

// Cleanup expired entries every 30 seconds
setInterval(cleanupExpiredLimits, 30000);