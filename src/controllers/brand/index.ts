const { genSalt } = require('bcrypt');
const Brand = require('../../models/brand');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initiatePayments } = require('../../external-apis/paystack');
const Transaction = require('../../models/transaction');

const {
  sendResetPasswordEmail,
  sendVerification,
} = require('../../utils/mailer');
const path = require('path');
const mongoose = require('mongoose');
const { generateOTP } = require('../authentication/otp');

const jwtSecret = process.env.JWT_BRAND_SECRET;

function validateVariable(variable) {
  return typeof variable !== 'undefined';
}

// handle post requests at "api/users/register"
exports.register = async (req, res) => {
  try {
    // create a new user after validating and sanitzing
    const { password, verifyPassword, username, email, name, ...others } =
      req.body;


    // if ( username || password ) this is wrong, it'll be true if any one of them is containing a value

    if (validateVariable(password) && validateVariable(email)) {
      const usernameExist = await Brand.findOne({ name: name });
      const emailExist = await Brand.findOne({ email });

      if (usernameExist) {
        return res.status(400).json({
          message: `brand name already exists ${name}`,
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
            const brand = await Brand.create({
              email: email,
              name: name,
              ...others,
              password: hashedPassword,
            });
            brand.save(brand);

            const OTP = await generateOTP(email);
            await sendVerification({ email, username, OTP });

            return res.status(201).json({
              message: 'user registered sucessfully',
              id: brand._id,
            });
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
    const brand = await Brand.findOneAndUpdate(
      { email },
      { email_verified: true },
    );

    res.status(201).json({ message: 'email verified successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'email not verified', error });
  }
};

// handle POST request at "api/users/login"
exports.login = async (req, res) => {
  const userInfo = req.body;
  const { emailOrUsername, password } = userInfo;
  if (emailOrUsername && password) {
    try {
      const brand = await Brand.findOne({ email: emailOrUsername })
        ?.populate('subscription')
        .exec();
      if (brand) {
        console.log(brand, 'brand');
        comparePassword(brand);
      } else {
        res.status(400).json({ message: 'brand does not exist' });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: 'something went wrong', error });
    }
    // compare the encrypted password with one the brand provided
    function comparePassword(brand) {
      bcrypt.compare(password, brand.password).then((isMatch) => {
        // if the password doesn't match, return a message
        if (!isMatch) {
          return res.status(400).json({
            message: 'Invalid password',
          });
          // if it matches generate a new token and send everything is json
        } else {
          generateNewToken(brand);
        }
      });
    }

    // generate new token with the new data
    function generateNewToken(brand) {
      jwt.sign(
        {
          id: brand._id,
          username: brand.userName,
          type: brand.accountType,
          isSuspended: brand.isSuspended,
          email: brand.email,
          subscription: brand.subscription,
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
  const { address, about, interests, nationality,companyRegistrationId } = req.body;

  try {
    // Find the Brand by id
    const userToUpdate = await Brand.findById(id);

    if (!userToUpdate) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    if (
      !address ||
      !about ||
      !interests ||
      !companyRegistrationId ||
      !nationality
    )
      return res
        .status(400)
        .json({ message: 'Some profile fields were not filled' });
    // Update profile details
    userToUpdate.address = address;
    userToUpdate.about = about;
    userToUpdate.interests = interests;
    userToUpdate.companyRegistrationId = companyRegistrationId;
    userToUpdate.nationality = nationality;
    userToUpdate.profileCreated = true;

    // Save the updated user
    const updatedBrand = await userToUpdate.save();

    res.status(201).json({
      message: 'Profile created',
      Brand: updatedBrand,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'internal server error', error });
  }
};

// handle get request at "/api/users/user"
exports.getBrand = (req, res) => {
  Brand.findById(req.user.id)
    .select('-password')
    .then((user) => res.status(200).json({ data: user, message: 'user found' }))
    .catch((err) => {
      res.status(500).json({ error: err, message: 'user not found' });
    });
};

// get all users"
exports.getBrands = (req, res) => {
  Brand.find()
    .select('-password')
    .then((brands) => res.json({ data: brands, message: 'request sucessful' }));
};

// get all restricted users
exports.getRestrictedbrands = (req, res) => {
  Brand.find({ isRestricted: true })
    .select('-password')
    .then((brands) => res.json({ data: brands, message: 'request sucessful' }));
};

// handle PUT at api/users/edit_account to edit user data
exports.editBrand = async (req, res) => {
  try {
    // Find the user to update
    const userToUpdate = await Brand.findById(req.user.id);

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
      nationality: req.body.nationality || userToUpdate.nationality,
      address: req.body.address || userToUpdate.address,
      birthDate: req.body.birthDate || userToUpdate.birthDate,
      gender: req.body.gender || userToUpdate.gender,
      about: req.body.about || userToUpdate.about,
      interests: req.body.interests || userToUpdate.interests,
    };

    // Check if the new username or email already exists
    const usernameExist = await Brand.findOne({
      username: req.body.username,
      _id: { $ne: req.user.id }, // Exclude the current user from the check
    });

    const emailExist = await Brand.findOne({
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
    const updatedUserResult = await Brand.findByIdAndUpdate(
      req.brand.id,
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
    try {
      await Brand.findByIdAndUpdate(
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

// this function is called after token has been verified
exports.verifyToken = async (req, res) => {
  res.status(200).json({ message: 'token verified' });
};

// function to subscibe an brand

exports.subscribe = async (req, res) => {
  const { email } = req.body;

  let amount: string, currency: string;

  amount = '1000000';
  currency = 'NGN';
  if (email && amount && currency) {
    try {
      const payment = await initiatePayments({ amount, email, currency });

      const { checkout_url, message, access_code, reference } = payment;

      const transaction = await Transaction.create({
        access_code,
        amount,
        message,
        reference,
        email,
        currency,
        type: 'brand_subscription',
        brand: new mongoose.Types.ObjectId(req?.user?.id),
      });

      return res
        .status(200)
        .json({ data: { checkout_url }, message: 'subsription complete' });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: 'something went wrong, subsription failed', error });
    }
  } else {
    return res
      .status(400)
      .json({ message: 'email, currency, amount cannot be empty' });
  }
};

// to delete user has to verify their identity by sign
exports.deleteAccount = async (req, res) => {
  const userInfo = req.body;
  const { emailOrId, password } = userInfo;
  if (emailOrId && password) {
    try {
      // check if user exists
      const brand =
        (await Brand.findOne({ username: emailOrId })) ||
        (await Brand.findOne({ email: emailOrId }));

      if (brand) {
        // console.log(user);
        // verify password
        const userValid = await bcrypt.compare(password, brand.password);
        if (userValid) {
          await Brand.findByIdAndDelete(Brand._id);
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
      const brand = await Brand.findOne({ email: email });

      if (brand) {
        const OTP = await generateOTP(email);
        await sendResetPasswordEmail({
          email,
          username: brand.username,
          OTP,
        });
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
  const { oldPassword, newPassword, confirmPassword } = req.body;
  try {
    if (newPassword === confirmPassword) {
      const brand = await Brand.findById(id);
      if (brand) {
        // console.log(user);
        const userValid = await bcrypt.compare(oldPassword, brand.password);
        if (userValid) {
          const salt = await genSalt();
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          await Brand.findByIdAndUpdate(id, {
            password: hashedPassword,
          });
          return res.status(201).json({
            message: 'Password changed sucessfully',
          });
        } else {
          return res.status(400).json({ message: 'old password incorrect' });
        }
      }
      res.status(400).json({ message: 'brand not found' });
    }
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
    const user = await Brand.findOne({ email });
    if (newPassword && verifyPassword) {
      if (user) {
        const salt = await genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        if (newPassword === verifyPassword) {
          try {
            await Brand.findOneAndUpdate(
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
