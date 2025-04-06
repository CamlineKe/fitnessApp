import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js"; // ✅ Import User model
import Logger from '../utils/logger.js';

dotenv.config();

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        Logger.debug("Received Auth Header:", authHeader);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided." });
        }

        const token = authHeader.split(" ")[1];
        Logger.debug("Extracted Token:", token);

        if (!token) {
            return res.status(403).json({ message: "Invalid token format." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        Logger.debug("Decoded Token:", decoded);

        if (!decoded.userId) { // ✅ JWT should store `userId`, not `id`
            return res.status(403).json({ message: "Invalid token payload." });
        }

        const user = await User.findById(decoded.userId).select("-password"); // ✅ Fetch user without password
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        req.user = user; // ✅ Attach full user object
        next();
    } catch (error) {
        Logger.error("Authentication error:", error.message);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired. Please log in again." });
        }

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
