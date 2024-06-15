const { genSalt } = require('bcrypt');
const Influencer = require('../../models/Influencer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  initiatePayments,
  createRecipient,
} = require('../../external-apis/paystack');
const Transaction = require('../../models/transaction');

const {
  sendResetPasswordEmail,
  sendVerification,
} = require('../../utils/mailer');
const path = require('path');
const mongoose = require('mongoose');
const { generateOTP } = require('../authentication/otp');

const jwtSecret = process.env.JWT_SECRET;

function validateVariable(variable) {
  return typeof variable !== 'undefined';
}

// handle post requests at "api/users/register"
exports.register = async (req, res) => {
  try {
    // create a new user after validating and sanitzing
    const {
      password,
      verifyPassword,
      username,
      email,
      firstName,
      lastName,
      ...others
    } = req.body;

    console.log('register request', req.body, username);

    // if ( username || password ) this is wrong, it'll be true if any one of them is containing a value

    if (validateVariable(password) && validateVariable(email)) {
      const usernameExist = await Influencer.findOne({ username: username });
      const emailExist = await Influencer.findOne({ email });

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
            const influencer = await Influencer.create({
              password: hashedPassword,
              username:
                username ||
                firstName + `${String(Math.random() * Date.now()).slice(0, 5)}`,
              email: email,
              firstName: firstName,
              lastName: lastName,
              others,
            });
            influencer.save(influencer);

            const OTP = await generateOTP(email);
            await sendVerification({ email, username, OTP });

            return res.status(201).json({
              message: 'user registered sucessfully',
              id: influencer._id,
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
    const influencer = await Influencer.findOneAndUpdate(
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
      const influencer = await Influencer.findOne({
        email: emailOrUsername,
      })?.populate('subscription');
      if (influencer) {
        comparePassword(influencer);
      } else {
        res.status(400).json({ message: 'Influencer account does not exist' });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: 'something went wrong', error });
    }
    // compare the encrypted password with one the influencer provided
    function comparePassword(influencer) {
      bcrypt.compare(password, influencer.password).then((isMatch) => {
        // if the password doesn't match, return a message
        if (!isMatch) {
          return res.status(400).json({
            message: 'Invalid password',
          });
          // if it matches generate a new token and send everything is json
        } else {
          generateNewToken(influencer);
        }
      });
    }

    // generate new token with the new data
    function generateNewToken(influencer) {
      jwt.sign(
        {
          id: influencer._id,
          type: influencer.accountType,
          username: influencer.userName,
          isSuspended: influencer.isSuspended,
          email: influencer.email,
          subscription: influencer.subscription,
          accountType:influencer.accountType
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
  const {
    address,
    about,
    gender,
    interests,
    monthlyIncomeRange,
    nationality,
    birthDate,
  } = req.body;

  try {
    // Find the influencer by id
    const userToUpdate = await Influencer.findById(id);

    if (!userToUpdate) {
      return res.status(404).json({ message: 'Influencer not found' });
    }

    if (
      !address ||
      !about ||
      !gender ||
      !interests ||
      !monthlyIncomeRange ||
      !nationality
    )
      return res
        .status(400)
        .json({ message: 'Some profile fields were not filled' });
    // Update profile details
    userToUpdate.address = address;
    userToUpdate.about = about;
    userToUpdate.gender = gender;
    userToUpdate.interests = interests;
    userToUpdate.monthlyIncomeRange = monthlyIncomeRange;
    userToUpdate.nationality = nationality;
    userToUpdate.birthDate = birthDate;
    userToUpdate.profileCreated = true;

    // Save the updated user
    const updatedInfluencer = await userToUpdate.save();

    res.status(200).json({
      message: 'Profile created',
      influencer: updatedInfluencer,
    });
  } catch (error) {
    console.log(error, 'create Profile error');
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// handle get request at "/api/users/user"
exports.getInfluencer = (req, res) => {
  Influencer.findById(req.user.id)
    .select('-password')
    .then((user) => res.status(200).json({ data: user, message: 'user found' }))
    .catch((err) => {
      res.status(500).json({ error: err, message: 'user not found' });
    });
};

// Controller function to fetch an influencer's campaign history
exports.getInfluencerCampaignHistory = async (req, res) => {
  const { id } = req.user; // Assuming the influencer's ID is passed as a URL parameter

  try {
    // Find the influencer by ID and populate the campaign history
    const influencer = await Influencer.findById(id).populate({
      path: 'campaignHistory.campaign', // Path to the campaigns in the campaignHistory array
      populate: [
        { path: 'brand' }, // Further populate the brand details in each campaign
        { 
          path: 'hires',
          populate: { path: 'influencer' }
        },
        {path:"proposals",
          populate: [{ path: 'campaign',populate: { path: 'brand' } },{path:"tasks"}]
        }
      ]
    });

    if (!influencer) {
      return res.status(404).json({ message: 'Influencer not found' });
    }

    // Respond with the populated campaign history
    res.status(200).json({
      success: true,
      data: influencer.campaignHistory,
      message: 'Campaign history retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching campaign history:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};


// get all users"
exports.getInfluencers = (req, res) => {
  Influencer.find()
    .select('-password')
    .then((influencers) =>
      res.json({ data: influencers, message: 'request sucessful' }),
    );
};

// get all restricted users
exports.getRestrictedInfluencers = (req, res) => {
  Influencer.find({ isRestricted: true })
    .select('-password')
    .then((influencers) =>
      res.json({ data: influencers, message: 'request sucessful' }),
    );
};

// handle PUT at api/users/edit_account to edit user data
exports.editInfluencer = async (req, res) => {
  try {
    // Find the user to update
    const userToUpdate = await Influencer.findById(req.user.id);

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
    const usernameExist = await Influencer.findOne({
      username: req.body.username,
      _id: { $ne: req.user.id }, // Exclude the current user from the check
    });

    const emailExist = await Influencer.findOne({
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
    const updatedUserResult = await Influencer.findByIdAndUpdate(
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

exports.filterInfluencers = async (req, res) => {
  try {
    let {
      sort,
      q,
      minRating,
      maxRating,
      interests,
      firstName,
      lastName,
      username,
      ...query
    } = req.query;

    console.log(req.query, "filter query");

    // Construct the text search condition
    if (q) {
      query.$text = { $search: q };
    }

    // Rating filter
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) {
        query.rating.$gte = parseFloat(minRating);
      }
      if (maxRating) {
        query.rating.$lte = parseFloat(maxRating);
      }
    }

    // Interests filter
    if (interests) {
      query.interests = { $in: interests.split(',') };
    }

    // First name filter
    if (firstName) {
      query.firstName = { $regex: firstName, $options: 'i' };
    }

    // Last name filter
    if (lastName) {
      query.lastName = { $regex: lastName, $options: 'i' };
    }

    // Username filter
    if (username) {
      query.username = { $regex: username, $options: 'i' };
    }

    // Sorting Result
    let sortList = { createdAt: -1 }; // Default sort by createdAt descending
    if (sort) {
      sortList = sort.split(',').reduce((acc, s) => {
        const [field, order] = s.split(':');
        acc[field] = order === 'desc' ? -1 : 1;
        return acc;
      }, {});
      console.log("filter Sortlist", sortList);
    }

    query.isSuspended = false;

    const influencers = await Influencer.find(query).sort(sortList).exec();

    if (!influencers || influencers.length === 0) {
      return res.status(400).json({ data: influencers, message: 'No item matches your search' });
    }

    return res.status(200).json({ data: influencers, message: 'Fetched influencers successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
};


//upload avatar
exports.createAvatar = async (req, res) => {
  console.log('upload body : ', req.body);
  if (req.file) {
    const { id } = req.user;
    try {
      await Influencer.findByIdAndUpdate(
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
    res
      .status(500)
      .json({ message: 'Image upload error: image file not found' });
  }
};

// this function is called after token has been verified
exports.verifyToken = async (req, res) => {
  res.status(200).json({ message: 'token verified' });
};

// function to subscibe an influencer

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
        type: 'influencer_subscription',
        influencer: new mongoose.Types.ObjectId(req?.user?.id),
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

// bank details

exports.createBankDetails = async (req, res) => {
  const { type, name, account_number, bank_code } = req.body;

  const reciepient = await createRecipient({
    type,
    name,
    account_number,
    bank_code,
  });

  if (reciepient) {
    if (reciepient.data.active) {
      await Influencer.findByIdAndUpdate(res.user.id, { $set: {} });
    }
  }
};

// withdrawal

// to delete user has to verify their identity by sign
exports.deleteAccount = async (req, res) => {
  const userInfo = req.body;
  const { emailOrId, password } = userInfo;
  if (emailOrId && password) {
    try {
      // check if user exists
      const influencer =
        (await Influencer.findOne({ username: emailOrId })) ||
        (await Influencer.findOne({ email: emailOrId }));

      if (influencer) {
        // console.log(user);
        // verify password
        const userValid = await bcrypt.compare(password, influencer.password);
        if (userValid) {
          await Influencer.findByIdAndDelete(Influencer._id);
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
      const influencer = await Influencer.findOne({ email: email });

      if (influencer) {
        const OTP = await generateOTP(email);
        await sendResetPasswordEmail({
          email,
          username: influencer.username,
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
      const influencer = await Influencer.findById(id);
      if (influencer) {
        // console.log(user);
        const userValid = await bcrypt.compare(
          oldPassword,
          influencer.password,
        );
        if (userValid) {
          const salt = await genSalt();
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          await Influencer.findByIdAndUpdate(id, {
            password: hashedPassword,
          });
          return res.status(201).json({
            message: 'Password changed sucessfully',
          });
        } else {
          return res.status(400).json({ message: 'old password incorrect' });
        }
      }
      res.status(400).json({ message: 'influencer not found' });
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
    const user = await Influencer.findOne({ email });
    if (newPassword && verifyPassword) {
      if (user) {
        const salt = await genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        if (newPassword === verifyPassword) {
          try {
            await Influencer.findOneAndUpdate(
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
