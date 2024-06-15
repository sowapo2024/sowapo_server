const OTP = require('../../models/otp');
const otpGenerator = require('otp-generator');

exports.generateOTP = async (email) => {
  let otp;

  // Generate a unique 6-digit OTP
  do {
    otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
  } while (await OTP.findOne({ otp }));

  const expires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

  const newOTP = new OTP({
    otp,
    email,
    expires,
  });

  await newOTP.save();

  console.log(`New OTP is ${otp}`);
  return otp;
};

exports.verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const otpDocument = await OTP.findOne({ email, otp });

    if (!otpDocument) {
      return res.status(404).json({ message: 'OTP is incorrect or does not exist.' });
    }

    const currentTime = Date.now();
    if (currentTime > otpDocument.expires) {
      await OTP.deleteOne({ _id: otpDocument._id }); // Optionally, delete the expired OTP
      return res.status(410).json({ message: 'OTP has expired.' });
    }

    // Proceed with user verification process here
    await OTP.deleteOne({ _id: otpDocument._id }); // Optionally, delete the OTP after successful verification

    next();
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
