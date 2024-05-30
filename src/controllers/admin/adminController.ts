
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Influencer = require("../../models/Influencer");
const Admin = require("../../models/admin")
const adminSignup = async (req, res) => {
  const { firstName, lastName, email, password,verifyPassword, role } = req.body;

  try {
    // Check if admin already exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ message: "Admin already exists" });
    }
    if (firstName && lastName && email && password && role) {

      if (password === verifyPassword) {
        admin = new Admin({
          firstName,
          lastName,
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
      }
      else{
        res.status(400).json({ message: "Password and verify password fields dont match" });

      }

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
const generateAllInfluencerGraphData = async (req, res) => {
  const { year } = req.params;

  try {
    // Query the database to get sales data for the specified year and seller
    const InfluencerData = await Influencer.aggregate([
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
    InfluencerData.forEach((sale) => {
      const monthIndex = sale._id - 1;
      monthlyData[monthIndex].totalUser = sale.totalUser;
    });

    res.json({ message: "request sucessfull", monthlyData });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Error generating Influencer graph data", error: err });
  }
};


const deleteAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    await Influencer.findOneAndDelete({ _id: userId });
    return res.status(201).json({
      message: "user deleted",
    });
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong: account could not be deleted",
      error,
    });
  }
};

const restrictUser = async (req, res) => {
  const { userId } = req.params;


  try {
    const user = await Influencer.findByIdAndUpdate(userId, {
      $set: { isSuspended: true },
    });
    return res.status(201).json({
      message: "user Suspended",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong: account could not be suspended",
      error,
    });
  }
};

const restrictAdmin = async (req, res) => {
  const { adminId } = req.params;

  try {
    const admin = await Admin.findByIdAndUpdate(adminId, {
      $set: { isSuspended: true },
    });
    return res.status(201).json({
      message: "admin Suspended",
      admin,
    });
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong: account could not be suspended",
      error,
    });
  }
};

const getUser = (req, res) => {
  Influencer.findById(req.params.userId)
    .select('-password')
    .then((user) => res.status(200).json({ user: user, message: 'user found' }))
    .catch((err) => {
      res.status(500).json({ error: err, message: 'user not found' });
    });
};
const getAdmin = (req, res) => {
  Admin.findById(req.params.adminId)
    .select('-password')
    .then((admin) => res.status(200).json({ admin: admin, message: 'admin found' }))
    .catch((err) => {
      res.status(500).json({ error: err, message: 'admin not found' });
    });
};

const updateAdmin = async (req,res)=>{
  // const { firstName, lastName, email, password, role }  = req.body
  const {id} = req.admin
  try {
    const admin = await Admin.findByIdAndUpdate(id,req.body,{new:true})
    res.staus(201).json({message:"admin updated"})
  } catch (error) {
    res.staus(500).json({message:"something went wrong, could not update admin"})
    
  }
  
}

const getAllAdmin = (req, res) => {
  Admin.find()
    .select('-password')
    .then((admin) => res.status(200).json({ admin: admin, message: 'user found' }))
    .catch((err) => {
      res.status(500).json({ error: err, message: 'user not found' });
    });
};

const deleteAdminAccount = async (req, res) => {
  const { adminId } = req.params;

  try {
    await Admin.findOneAndDelete({ _id: adminId });
    return res.status(201).json({
      message: "admin account deleted",
    });
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong: account could not be deleted",
      error,
    });
  }
};

const banAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    await Influencer.findByIdAndUpdate(userId, { $set: { isBanned: true } });
    return res.status(201).json({
      message: "user banned",
    });
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong: account could not be banned",
      error,
    });
  }
};


const verifyToken = async (req, res) => {
  res.status(200).json({ message: "token verified" });
};

const activateAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await Influencer.findById(userId);
    if (user.isBanned) {
      await Influencer.findByIdAndUpdate(userId, { $set: { isBanned: false } });
      return res.status(201).json({
        message: "user re-activated",
      });
    } else if (user.isSuspended) {
      await Influencer.findByIdAndUpdate(userId, { $set: { isSuspended: false } });
      return res.status(201).json({
        message: "user re-activated",
      });
    } else {
      return res.status(400).json({
        message: "user is already active",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong: account could not be reactivated",
      error,
    });
  }
};

const activateAdminAccount = async (req, res) => {
  const { adminId } = req.params;

  try {
    const admin = await Admin.findById(adminId);
    if (admin.isBanned) {
      await Admin.findByIdAndUpdate(adminId, { $set: { isBanned: false } });
      return res.status(201).json({
        message: "user re-activated",
      });
    } else if (admin.isSuspended) {
      await Admin.findByIdAndUpdate(adminId, { $set: { isSuspended: false } });
      return res.status(201).json({
        message: "admin re-activated",
      });
    } else {
      return res.status(400).json({
        message: "admin is already active",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong: account could not be reactivated",
      error,
    });
  }
};
module.exports = {
  restrictAdmin,
  restrictUser,
  activateAccount,
  banAccount,
  deleteAccount,
  adminSignIn,
  adminSignup,
  generateAllInfluencerGraphData,
  verifyToken,
  deleteAdminAccount,
  getUser,
  getAdmin,
  updateAdmin,
  getAllAdmin,
  activateAdminAccount
};
