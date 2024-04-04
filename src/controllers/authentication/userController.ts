const { genSalt } = require('bcrypt');
const User = require('../../models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  sendResetPasswordEmail,
  sendVerification,
} = require('../../utils/mailer');
const path = require('path');
const mongoose = require('mongoose');
const { generateOTP } = require('./otp');

const jwtSecret = process.env.JWT_SECRET;

function validateVariable(variable) {
  return typeof variable !== 'undefined';
}

// handle post requests at "api/users/register"
exports.createUser = async (req, res) => {
  try {
    // create a new user after validating and sanitzing
    const { password, verifyPassword, username, email, firstName, lastName } =
      req.body;

    console.log('register request', req.body, username);

    // if ( username || password ) this is wrong, it'll be true if any one of them is containing a value

    if (
      validateVariable(username) &&
      validateVariable(password) &&
      validateVariable(email)
    ) {
      const usernameExist = await User.findOne({ username: username });
      const emailExist = await User.findOne({ email });

      if (usernameExist) {
        return res.status(400).json({
          message: `username already exists ${username}`,
          usernameExist,
        });
      } else if (emailExist) {
        return res
          .status(400)
          .json({ message: `email already exists ${email}`, emailExist });
      } else {
        if (password == verifyPassword) {
          const salt = await bcrypt.genSalt();
          const hashedPassword = await bcrypt.hash(password, salt);

          try {
            const user = await User.create({
              password: hashedPassword,
              username:
                username ||
                firstName + `${String(Math.random() * Date.now()).slice(0, 5)}`,
              email: email,
              firstName: firstName,
              lastName: lastName,
            });
            user.save(user);

            const OTP = await generateOTP(email);
            await sendVerification({ email, username, OTP });

            return res
              .status(201)
              .json({ message: 'user registered sucessfully', id: user._id });
          } catch (error) {
            console.log(error);
            return res
              .status(400)
              .json({ message: 'user could not be registered', error: error });
          }
        } else {
          return res.status(401).json({
            message: "password and confirm password field don't match",
          });
        }
      }
    } else {
      return res.status(400).json({ message: 'fill in required fields' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'something went wrong' });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { email_verified: true },
    );

    res.status(201).json({message:"email verified successfully"})
  } catch (error) {
    console.log(error)
    return res.status(500).json({message:"email not verified",error})

  }
};

// handle POST request at "api/users/login"
exports.login = async (req, res) => {
  const userInfo = req.body;
  const { emailOrUsername, password } = userInfo;
  if (emailOrUsername && password) {
    try {
      const user =
        (await User.findOne({ username: emailOrUsername })) ||
        (await User.findOne({ email: emailOrUsername }));
      if (user) {
        comparePassword(user);
      } else {
        res.status(400).json({ message: 'user does not exist' });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: 'something went wrong', error });
    }
    // compare the encrypted password with one the user provided
    function comparePassword(user) {
      bcrypt.compare(password, user.password).then((isMatch) => {
        // if the password doesn't match, return a message
        if (!isMatch) {
          return res.status(400).json({
            message: 'Invalid password',
          });
          // if it matches generate a new token and send everything is json
        } else {
          generateNewToken(user);
        }
      });
    }

    // generate new token with the new data
    function generateNewToken(user) {
      jwt.sign(
        {
          id: user._id,
          username: user.userName,
          isSuspended: user.isSuspended,
          email: user.email,
          subscription: user.subscription,
        },
        jwtSecret,
        { expiresIn: '3d' },
        (err, token) => {
          if (err) {
            console.log(err);
            res.json({ err });
          } else {
            res.status(200).json({
              token,
              message: 'Logged in Succefully',
            });
          }
        },
      );
    }
  } else {
    res.status(400).json({ message: 'fill in  your credentials' });
  }
};

exports.createProfile = async (req, res) => {
  const { id } = req.user;
  const { address, about, firstName, lastName } = req.body;

  try {
    await User.findById(req.user.id, async (err, userToUpdate) => {
      if (err) {
        res
          .status(400)
          .json({ message: 'Error getting user. Please try again.' });
      } else {
        // Create user profile
        let updatedUser = {
          firstName: req.body.firstName
            ? req.body.firstName
            : userToUpdate.firstName,
          lastName: req.body.lastName
            ? req.body.lastName
            : userToUpdate.lastName,
          about: about ? about : userToUpdate.about,
          address: address ? address : userToUpdate.address,
          profileCreated: true,
        };

        User.findByIdAndUpdate(req.user.id, updatedUser, {
          new: true,
          useFindAndModify: false,
        })
          .select('-password')
          .then((user) => {
            res.status(200).json({
              message: 'Account updated',
              user,
            });
          })
          .catch((err) => {
            res.status(400).json({ message: "Couldn't update", err });
          });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'profile created' });
  }
};

// handle get request at "/api/users/user"
exports.getUser = (req, res) => {
  User.findById(req.user.id)
    .select('-password')
    .then((user) => res.status(200).json({ user: user, message: 'user found' }))
    .catch((err) => {
      res.status(500).json({ error: err, message: 'user not found' });
    });
};

// get all users"
exports.getUsers = (req, res) => {
  User.find()
    .select('-password')
    .then((user) => res.json({ users: user, message: 'request sucessful' }));
};

// get all restricted users
exports.getRestrictedUsers = (req, res) => {
  User.find({ isRestricted: true })
    .select('-password')
    .then((user) => res.json({ users: user, message: 'request sucessful' }));
};

// handle PUT at api/users/edit_account to edit user data
exports.editUser = async (req, res) => {
  try {
    // Find the user to update
    const userToUpdate = await User.findById(req.user.id);

    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create user with the new data
    const updatedUser = {
      firstName: req.body.firstName || userToUpdate.firstName,
      lastName: req.body.lastName || userToUpdate.lastName,
      email: req.body.email || userToUpdate.email,
      phone: req.body.phone || userToUpdate.phone,
      username: req.body.username || userToUpdate.username,
    };

    // Check if the new username or email already exists
    const usernameExist = await User.findOne({
      username: req.body.username,
      _id: { $ne: req.user.id }, // Exclude the current user from the check
    });

    const emailExist = await User.findOne({
      email: req.body.email,
      _id: { $ne: req.user.id }, // Exclude the current user from the check
    });

    if (usernameExist) {
      return res.status(400).json({
        message: `Username already exists: ${req.body.username}`,
        usernameExist,
      });
    } else if (emailExist) {
      return res.status(400).json({
        message: `Email already exists: ${req.body.email}`,
        emailExist,
      });
    }

    // Update the user
    const updatedUserResult = await User.findByIdAndUpdate(
      req.user.id,
      updatedUser,
      {
        new: true,
        useFindAndModify: false,
      },
    ).select('-password');

    res.status(200).json({
      message: 'Account settings updated',
      user: updatedUserResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Couldn't update user", error });
  }
};

//upload avatar
exports.createAvatar = async (req, res) => {
  if (req.file) {
    const { id } = req.user;
    console.log(req.file);
    try {
      await User.findByIdAndUpdate(
        id,
        {
          $set: {
            avatar: path.join(req.file.path),
          },
        },
        { new: true },
      );
      res
        .status(201)
        .json({ message: 'avatar created successfully', path: req.file.path });
    } catch (error) {
      console.log(error);
      res
        .status(400)
        .json({ message: 'avatar creation is not successful', error: error });
    }
  } else {
    res.status(400).json({ message: 'error' });
  }
};

//upload user Images
exports.uploadImages = async function (req, res) {
  try {
    const { id } = req.user;

    await req?.files?.map(async (file) => {
      const newImage = { url: file.path, id: new mongoose.Types.ObjectId() };

      console.log(newImage);
      const user = await User.findByIdAndUpdate(id, {
        $push: { userImages: newImage },
      });
    });

    return res.status(201).json({ message: 'Image(s) uploaded sucessfully' });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: 'Image(s) not uploaded sucessfully', error });
  }
};

//delete user Images
exports.deleteUserImage = function (req, res) {
  const { id } = req.body;

  const { imageId } = req.params;
  console.log(imageId);
  try {
    User.updateOne(
      { _id: id },
      { $pull: { userImages: { _id: mongoose.Types.ObjectId(imageId) } } },
    ).then((user) => {
      return res.status(201).json({ message: 'Image(s) deleted sucessfully' });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Image(s) not deleted sucessfully' });
  }
};

// this function is called after token has been verified
exports.verifyToken = async (req, res) => {
  res.status(200).json({ message: 'token verified' });
};

// to delete user has to verify their identity by sign
exports.deleteAccount = async (req, res) => {
  const userInfo = req.body;
  const { emailOrId, password } = userInfo;
  if (emailOrId && password) {
    try {
      // check if user exists
      const user =
        (await User.findOne({ username: emailOrId })) ||
        (await User.findOne({ email: emailOrId }));

      if (user) {
        // console.log(user);
        // verify password
        const userValid = await bcrypt.compare(password, user.password);
        if (userValid) {
          await User.findByIdAndDelete(user._id);
          return res.status(201).json({
            message: 'user deleted',
          });
        } else {
          return res.status(401).json({ message: 'password incorrect' });
        }
      } else {
        res.status(404).json({ message: ' email or user ID is wrong' });
      }
    } catch (error) {
      return res.status(404).json({
        message: 'something went wrong: account could not be deleted',
        error,
      });
    }
  } else {
    res.status(401).json({ message: 'fill out the necessary fields' });
  }
};

// to get password link
exports.forgotPasswordLink = async (req, res) => {
  const { email } = req.body;
  if (email) {
    try {
      const user = await User.findOne({ email: email });

      if (user) {
        const OTP = await generateOTP(email);
        await sendResetPasswordEmail({ email, username: user.username, OTP });
        res.status(200).json({ message: 'otp sent sucessfully' });
      } else {
        res.status(400).json({ message: 'user not found' });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'something went wrong', error });
    }
  } else {
    res.status(400).json({ message: 'no email in request body' });
  }
};

//updates the password to the new password
exports.changePassword = async (req, res) => {
  const { id } = req.user;
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(id);
    if (user) {
      // console.log(user);
      const userValid = await bcrypt.compare(oldPassword, user.password);
      if (userValid) {
        const salt = await genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.findByIdAndUpdate(id, {
          password: hashedPassword,
        });
        return res.status(201).json({
          message: 'Password changed sucessfully',
        });
      } else {
        return res.status(400).json({ message: 'old password incorrect' });
      }
    }
    res.status(400).json({ message: 'user not found' });
  } catch (error) {
    res
      .status(400)
      .json({ message: 'error: could not change password', error });
  }
};

//change password
exports.resetPassword = async (req, res) => {
  const { newPassword, verifyPassword, email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (newPassword && verifyPassword) {
      if (user) {
        const salt = await genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        if (newPassword === verifyPassword) {
          try {
            await User.findOneAndUpdate(
              { email },
              {
                password: hashedPassword,
              },
            );
            return res.status(201).json({
              message: 'Password changed sucessfully',
            });
          } catch (error) {
            console.log(error);
            return res.status(500).json({
              message: 'error: Password could not be changed sucessfully',
            });
          }
        } else {
          res.status(400).json({
            message: 'error: Passwords do not match',
          });
        }
      } else {
        res.status(400).json({ message: 'user not found' });
      }
    } else {
      return res
        .status(400)
        .json({ message: 'fill in the necessary credentials' });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: 'error: could not change password', error });
  }
};
