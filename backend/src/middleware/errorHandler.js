export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` })
}

export const errorHandler = (error, req, res, next) => {
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500
  res.status(statusCode).json({
    message: error.message || 'Server error',
    ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {}),
  })
}
