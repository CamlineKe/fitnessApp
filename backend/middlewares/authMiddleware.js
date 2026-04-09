import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
import Logger from '../utils/logger.js';

dotenv.config();

const authMiddleware = async (req, res, next) => {
    try {
        // ✅ Try to get token from httpOnly cookie first, then fallback to Authorization header
        let token = req.cookies?.accessToken;
        
        if (!token) {
            const authHeader = req.header("Authorization");
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }

        if (!token) {
            return res.status(401).json({ message: "No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.userId) {
            return res.status(403).json({ message: "Invalid token payload." });
        }

        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        req.user = user;
        next();
    } catch (error) {
        // Only log unexpected auth errors - expired/missing tokens are normal on public pages
        if (error.name === "TokenExpiredError") {
            Logger.debug("Token expired (expected for unauthenticated users)");
            return res.status(401).json({ 
                message: "Access token expired",
                code: "TOKEN_EXPIRED"
            });
        }

        Logger.error("Authentication error:", error.message);
        res.status(403).json({ message: "Invalid token. Access denied." });
    }
};

// ✅ Improved admin check
export const adminMiddleware = (req, res, next) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: "Server error in admin check." });
    }
};


export default authMiddleware;
