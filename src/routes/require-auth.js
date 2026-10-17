module.exports = (authService) => (req, res, next) => {
  try {
    req.user = authService.verify((req.get('authorization') || '').replace(/^Bearer /, ''));
    next();
  } catch (err) { next(err); }
};
