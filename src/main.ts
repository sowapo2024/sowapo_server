const express = require("express");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
require("dotenv").config();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");


// initializing routes 
const usersRouter = require("./routes/users");

const app = express();

// for body-parser middleware
app.use(express.json());



// morgan logger for dev
app.use(logger("dev"));

//make our upload an accesable folder
app.use("/tmp/uploads", express.static("uploads"));

app.use(express.urlencoded({ extended: false }));

// cors configuration
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Database uri
let dbURI;

// // serve static assets if in production (heroku configuration)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
  dbURI = process.env.DB_URI;
}

if (process.env.NODE_ENV == "production") {
  // // set static folder
  // app.use(express.static(path.join(__dirname, "views", "build")));

  // app.get("*", (req, res) => {
  //   res.sendFile(path.join(__dirname, "views", "build", "index.html"));
  // });
  dbURI = process.env.DB_URI;
}

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//test database connection
let db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function (con) {
  console.log("Database connected succefully...");
});

// Set up our main routes
app.use("/api/users", usersRouter);

// if the request passes all the middleware without a response
app.use((req, res, next) => {
  const error:any = new Error("Not Found");
  error.status = 404;
  next(error);
});

// for general error handling
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    message: error.response,
  });
});


// to declare port and isten to server  events
const PORT:string|number = process.env.PORT || 4000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT} at `+ new Date().toTimeString())
})