import jwt from 'jsonwebtoken'

// Verify any logged-in user — decodes the JWT and attaches user info to req.user
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' })
  }

  // Header format: "Bearer <token>" — strip the "Bearer " prefix
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // { id, email, name, role }
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Verify the user is an admin — must be logged in AND have role 'admin'
export const verifyAdminToken = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }
    next()
  })
}