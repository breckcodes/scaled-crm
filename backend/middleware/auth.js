const jwt = require('jsonwebtoken')

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  const token = authHeader.split(' ')[1]
  if (!token || token === 'dev-token' || token.startsWith('dev-')) {
    return res.status(401).json({ error: 'Invalid token' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded.id || decoded.id === 0) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid' })
  }
}
