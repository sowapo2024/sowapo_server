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


// middleware to accept images, videos and audio 
exports.allMedia = (req,res,next)=>{
  var mediaStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "Posts",
      allowed_formats: ["jpg", "png", "jpeg", "gif", "mp4", "mp3", "avi", "wav", "ogg", "mpa"],
 // supports promises as well
    },
  });
  const upload = multer({
    storage:mediaStorage,
    limits: {
      fileSize: 1024 * 1024 * 100, // 100MB file size limit
    }, 
  })

  upload.array("media")(req,res,(error)=>{
    if (error) {
      console.error("Media upload failed:", error);

      let errorMessage = "Media upload failed";
      let errorCode = "UPLOAD_ERROR";

      if (error.code === "LIMIT_FILE_SIZE") {
        errorMessage = "File size exceeds the limit (100MB)";
        errorCode = "FILE_SIZE_LIMIT_EXCEEDED";
      } else if (error.message === "Invalid file format") {
        errorMessage = "Invalid file format";
        errorCode = "INVALID_FILE_FORMAT";
      }

      return res.status(400).json({
        error: errorMessage,
        errorCode,
        errorStack:error
      });
    }

    next()
  })
}


// middleware to accept all media types
exports.allMediaTypes = async (req, res, next) => {
  function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
      fn(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
  }

  try {
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 1024 * 1024 * 100, // 100MB file size limit
      },
    });

    const myUploadMiddleware = upload.array("media");

    // Run the multer middleware for multiple files
    await runMiddleware(req, res, myUploadMiddleware);

    // Convert each file to a data URI
    const filesDataURI = req?.files?.map((file) => {
      const b64 = Buffer.from(file.buffer).toString("base64");
      return "data:" + file.mimetype + ";base64," + b64;
    });

    // Upload all files to Cloudinary
    const uploadResults = await Promise.all(
      filesDataURI.map((dataURI) =>
        cloudinary.uploader.upload(dataURI, {
          resource_type: "auto",
        })
      )
    );

    // Add file paths to the request for later use
    req.filePaths = req.files.map((file, i) => ({
      path: uploadResults[i].secure_url,
      filename: file.originalname.slice(0, 20), // Truncate filename if necessary
      mimetype: file.mimetype,
    }));
    next();
  } catch (error) {
    console.error("Media upload failed:", error);

    let errorMessage = "Media upload failed";
    let errorCode = "UPLOAD_ERROR";

    if (error.code === "LIMIT_FILE_SIZE") {
      errorMessage = "File size exceeds the limit (100MB)";
      errorCode = "FILE_SIZE_LIMIT_EXCEEDED";
    } else if (error.message === "Invalid file format") {
      errorMessage = "Invalid file format";
      errorCode = "INVALID_FILE_FORMAT";
    }

    return res.status(400).json({
      error: errorMessage,
      errorCode,
      errorStack: error,
    });
  }
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