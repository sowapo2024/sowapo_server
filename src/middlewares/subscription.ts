const User = require("../models/Users");
const Subscription = require("../models/subscription");

const authenticateSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming you have a user object in the request after authentication

    // Check if the user has a valid subscription
    const userWithSubscription = await User.findById(userId)?.populate("subscription");

    if (!userWithSubscription?.subscription) {
      return res.status(401).json({ message: "Unauthorized: No valid subscription" });
    }
    // Check if the subscription is not expired
    const currentDate = new Date();
    if (userWithSubscription?.subscription?.endDate < currentDate) {
      return res.status(401).json({ message: "Unauthorized: Subscription has expired" });
    }

    // If the user has a valid subscription and it's not expired, proceed to the next middleware or route
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = authenticateSubscription;
