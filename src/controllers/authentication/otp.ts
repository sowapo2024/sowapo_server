const OTP = require("../../models/otp")
const otpGenerator = require("otp-generator")


exports.generateOTP = async (email:string): Promise<string> => {
    let otp: string;

    otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });

    let otpExists = await OTP.findOne({ otp });

    // Loop until a unique OTP is generated
    while (otpExists) {
        otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets:false });
        otpExists = await OTP.findOne({ otp });
    }
    await OTP.create({
        otp,
        email
    })
    return otp;
}


exports.verifyOTP = async (req, res,next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    try {
        const otpDocument = await OTP.findOne({ email: email, otp: otp });

        if (!otpDocument) {
            return res.status(404).json({ message: 'OTP is incorrect or does not exist.' });
        }

        // Check if the OTP has expired
        const currentTime = Date.now();
        if (currentTime > otpDocument.expires) {
            // Optionally, delete the expired OTP document here
            // await otpDocument.remove();
            return res.status(410).json({ message: 'OTP has expired.' });
        }

        // OTP is correct and has not expired
        // Here, you can proceed with the user verification process

        // Optionally, delete the OTP document after successful verification
        await otpDocument.remove();

        next()
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}