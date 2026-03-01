/**
 * Middleware de autorización por roles.
 * Uso: roles('ADMIN', 'AGENT')
 */
module.exports = function roles(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado: permisos insuficientes' });
    }
    next();
  };
};
