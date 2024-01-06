const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

var storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "UserImages",
    allowed_formats: ["jpg", "png", "jpeg", "gif"], // supports promises as well
  },
});

exports.multipleImages = function (req, res, next) {
  // Create a Multer upload object
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 5, // 5MB file size limit
    },
  });
  upload.array("images")(req, res, (error) => {
    if (error) {
      console.log(error)
      // Handle any Multer errors
      return res.status(400).json({
        error: "Image upload failed",
        errorStack:error
      });
    }

    // If no errors, move on to the next middleware
    next();
  });
};

exports.singleImage = function (req, res, next) {
    // Create a Multer upload object
    const upload = multer({
      storage: storage,
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB file size limit
      },
    });
    upload.single("image")(req, res, (error) => {
      if (error) {
        console.log(error)
        // Handle any Multer errors
        return res.status(400).json({
          error: "Image upload failed",
          errorStack:error
        });
      }
  
      // If no errors, move on to the next middleware
      next();
    });
  };

  exports.userImages = function (req, res, next) {
    // Create a Multer upload object
    const upload = multer({
      storage: storage,
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB file size limit
      },
    });
    upload.array("images")(req, res, (error) => {
      if (error) {
        console.log(error)
        // Handle any Multer errors
        return res.status(400).json({
          error: "Image upload failed",
          errorStack:error
        });
      }
  
      // If no errors, move on to the next middleware
      next();
    });
  };
// in case for images local storing
// Multer handling image upload Middleware at /api/product/create
exports.multipleMulterImageHandler = (req, res, next) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../uploads"));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  const upload = multer({ storage }).array("images", 4);
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.error(err);
      res.status(400).json({ message: "File upload error", err });
    } else if (err) {
      // An unknown error occurred when uploading.
      console.error(err,'error');
      res.status(500).json({ message: "Internal server error" });
    } else {
      // Everything went fine.
      next();
    }
  });
};


exports.singleMulterImageHandler = (req, res, next) => {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads"));
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
      },
    });
  
    const upload = multer({ storage }).single("image");
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.error(err);
        res.status(400).json({ message: "File upload error", err });
      } else if (err) {
        // An unknown error occurred when uploading.
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
      } else {
        // Everything went fine.
        next();
      }
    });
  };