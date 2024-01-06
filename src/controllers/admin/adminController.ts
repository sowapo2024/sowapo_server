const Admin = require("../models/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Users = require("../models/UsersModel");

const adminSignup = async (req, res) => {
  const { firstName, lastName, userName, email, password, role } = req.body;

  try {
    // Check if admin already exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ msg: "Admin already exists" });
    }
    if (firstName && lastName && userName &&email && password && role) {
      admin = new Admin({
        firstName,
        lastName,
        userName,
        email,
        password,
        role,
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);

      admin.password = await bcrypt.hash(password, salt);

      // Save admin to database
      await admin.save();

      res.status(200).json({ message: "Admin created successfully" });
    } else {
      res.status(400).json({ message: "error: fill in all necessary fields" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

// Handle POST request at /api/admin/signin
const adminSignIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the admin by email
    const admin = await Admin.findOne({ email });

    // If the admin doesn't exist, return error message
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, admin.password);

    // If the password is incorrect, return error message
    if (!isMatch) {
      return res.status(401).json({ message: "password incorrect" });
    }

    // If the email and password are correct, create a JSON Web Token (JWT) for authentication
    const token = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_ADMIN_SECRET,
      { expiresIn: "3h" }
    );

    // Return the token to the client
    res.status(200).json({ message: "Admin signed in successfully", token });
  } catch (err) {
    // If there is an error, return error message
    console.log(err,'error')
    res.status(500).json({ message: "Error signing in admin", err });
  }
};


// const getAccounts = ()=>{

// }
const generateAllUsersGraphData = async (req, res) => {
  const { year } = req.params;

  try {
    // Query the database to get sales data for the specified year and seller
    const usersData = await Users.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalUser: { $count:{}},
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    // Create an array with default monthly data
    const monthlyData = [
      { name: "Jan", totalUser: 0 },
      { name: "Feb", totalUser: 0 },
      { name: "Mar", totalUser: 0 },
      { name: "Apr", totalUser: 0 },
      { name: "May", totalUser: 0 },
      { name: "Jun", totalUser: 0 },
      { name: "Jul", totalUser: 0 },
      { name: "Aug", totalUser: 0 },
      { name: "Sep", totalUser: 0 },
      { name: "Oct", totalUser: 0 },
      { name: "Nov", totalUser: 0 },
      { name: "Dec", totalUser: 0 },
    ];

    // Update the monthly data with actual sales totals
    usersData.forEach((sale) => {
      const monthIndex = sale._id - 1;
      monthlyData[monthIndex].totalUser = sale.totalUser;
    });

    res.json({ message: "request sucessfull", monthlyData });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Error generating users graph data", error: err });
  }
};

const generateAllPremiumUsersGraphData = async (req, res) => {
  const { year } = req.params;

  try {
    // Query the database to get sales data for the specified year and seller
    const usersData = await Users.aggregate([
      {
        $match: {
          isPremium:true,
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalUser: { $sum: "$price" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Create an array with default monthly data
    const monthlyData = [
      { name: "Jan", totalUser: 0 },
      { name: "Feb", totalUser: 0 },
      { name: "Mar", totalUser: 0 },
      { name: "Apr", totalUser: 0 },
      { name: "May", totalUser: 0 },
      { name: "Jun", totalUser: 0 },
      { name: "Jul", totalUser: 0 },
      { name: "Aug", totalUser: 0 },
      { name: "Sep", totalUser: 0 },
      { name: "Oct", totalUser: 0 },
      { name: "Nov", totalUser: 0 },
      { name: "Dec", totalUser: 0 },
    ];

    // Update the monthly data with actual sales totals
    usersData.forEach((sale) => {
      const monthIndex = sale._id - 1;
      monthlyData[monthIndex].totalUser = sale.totalUser;
    });

    res.json({ message: "request sucessfull", monthlyData });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Error generating users graph data", error: err });
  }
};

const deleteAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    await Users.findOneAndDelete({ _id: userId });
    return res.status(201).json({
      msg: "user deleted",
    });
  } catch (error) {
    return res.status(500).json({
      msg: "something went wrong: account could not be deleted",
      error,
    });
  }
};

const suspendAccount = async (req, res) => {
  const { userId } = req.params;


  try {
    const user = await Users.findByIdAndUpdate(userId, {
      $set: { isSuspended: true },
    });
    return res.status(201).json({
      msg: "user Suspended",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "something went wrong: account could not be suspended",
      error,
    });
  }
};

const banAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    await Users.findByIdAndUpdate(userId, { $set: { isBanned: true } });
    return res.status(201).json({
      msg: "user banned",
    });
  } catch (error) {
    return res.status(500).json({
      msg: "something went wrong: account could not be banned",
      error,
    });
  }
};


const verifyToken = async (req, res) => {
  res.status(200).json({ msg: "token verified" });
};

const activateAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await Users.findById(userId);
    if (user.isBanned) {
      await Users.findByIdAndUpdate(userId, { $set: { isBanned: false } });
      return res.status(201).json({
        msg: "user re-activated",
      });
    } else if (user.isSuspended) {
      await Users.findByIdAndUpdate(userId, { $set: { isSuspended: false } });
      return res.status(201).json({
        msg: "user re-activated",
      });
    } else {
      return res.status(400).json({
        msg: "user is already active",
      });
    }
  } catch (error) {
    return res.status(500).json({
      msg: "something went wrong: account could not be reactivated",
      error,
    });
  }
};
module.exports = {
  activateAccount,
  banAccount,
  suspendAccount,
  deleteAccount,
  adminSignIn,
  adminSignup,
  generateAllPremiumUsersGraphData,
  generateAllUsersGraphData,
  verifyToken,
};
