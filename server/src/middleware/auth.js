import jwt from "jsonwebtoken";

export function requireAuth(request, response, next) {
  const authorization = request.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Sign in to continue." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    request.userId = payload.sub;
    return next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired token." });
  }
}
