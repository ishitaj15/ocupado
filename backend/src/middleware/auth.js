export const verifyAdminToken = (req, res, next) => {
  const token = req.headers['authorization']

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  if (token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(403).json({ error: 'Invalid admin token' })
  }

  next()
}