export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  res.status(Number(error.statusCode || 500)).json({
    success: false,
    message: error.message || "Internal server error",
    ...(error.details ? { details: error.details } : {})
  });
}
