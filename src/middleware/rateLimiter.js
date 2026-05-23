const rateLimitStore = {};

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const ip in rateLimitStore) {
        for (const key in rateLimitStore[ip]) {
            rateLimitStore[ip][key] = rateLimitStore[ip][key].filter(timestamp => now - timestamp < 3600000); // 1 hour max
            if (rateLimitStore[ip][key].length === 0) {
                delete rateLimitStore[ip][key];
            }
        }
        if (Object.keys(rateLimitStore[ip]).length === 0) {
            delete rateLimitStore[ip];
        }
    }
}, 300000);

const rateLimiter = (limit, windowMs, message) => {
    return (req, res, next) => {
        // Use proxy-friendly IP if behind a reverse proxy, fallback to req.ip
        const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const routeKey = req.baseUrl + req.path;

        if (!rateLimitStore[ip]) {
            rateLimitStore[ip] = {};
        }

        if (!rateLimitStore[ip][routeKey]) {
            rateLimitStore[ip][routeKey] = [];
        }

        // Filter out timestamps outside the window
        rateLimitStore[ip][routeKey] = rateLimitStore[ip][routeKey].filter(
            timestamp => now - timestamp < windowMs
        );

        if (rateLimitStore[ip][routeKey].length >= limit) {
            return res.status(429).json({ message });
        }

        rateLimitStore[ip][routeKey].push(now);
        next();
    };
};

module.exports = {
    registerLimiter: rateLimiter(10, 60 * 60 * 1000, 'Too many registration attempts from this IP. Please try again after an hour.'),
    loginLimiter: rateLimiter(20, 15 * 60 * 1000, 'Too many login attempts. Please try again after 15 minutes.'),
    resendLimiter: rateLimiter(5, 5 * 60 * 1000, 'Too many verification code requests. Please wait 5 minutes before trying again.')
};
