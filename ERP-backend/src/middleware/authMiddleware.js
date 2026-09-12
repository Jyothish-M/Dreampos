// Authentication Middleware
// Currently not implemented - can be added later when needed

export const protect = (req, res, next) => {
  // Authentication disabled - pass through all requests
  next();
};

export const optionalAuth = (req, res, next) => {
  // Authentication disabled - pass through all requests
  next();
};
