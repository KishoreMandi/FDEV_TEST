const trainerMiddleware = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "trainer") {
    return res.status(403).json({ message: "Trainer or Admin access only" });
  }
  next();
};

export default trainerMiddleware;
