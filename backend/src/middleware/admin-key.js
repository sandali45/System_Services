export function requireAdminKey(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;
  const supplied = req.header("x-admin-key");

  if (!expected || supplied !== expected) {
    return res.status(401).json({
      success: false,
      message: "Valid Admin API key required"
    });
  }

  next();
}
