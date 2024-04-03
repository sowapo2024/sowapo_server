const express = require("express");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const cron = require('node-cron');
const {sendDailyDevotionReminder} = require("./controllers/devotional/devotional")

// initializing routes 
const usersRouter = require("./routes/users");
const postRouter = require("./routes/posts")
const testimonyRouter = require("./routes/testimony")
const announcementRouter = require("./routes/announcement")
const sermonsRouter = require("./routes/sermon")
const booksRouter = require("./routes/books")
const adminRouter = require("./routes/admin")
const donationRouter = require("./routes/donation")
const webhookRouter = require("./routes/webhook")
const devotionalRoute = require("./routes/devotional")
const transactionRoute = require("./routes/transaction")
const streamsRoute = require("./routes/streams")






// importing paystack webhook
const {webhook} = require("./external-apis/paystack")

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
app.use("/api/posts",postRouter);
app.use("/api/testimonies",testimonyRouter);
app.use("/api/announcements",announcementRouter)
app.use("/api/sermons",sermonsRouter)
app.use("/api/books",booksRouter)
app.use("/api/admin",adminRouter)
app.use("/api/donations",donationRouter)
app.use("/api/webhook",webhookRouter)
app.use("/api/devotionals",devotionalRoute)
app.use("/api/transactions",transactionRoute)
app.use("/api/streams",streamsRoute)





// set up webhook endpoint for paystack

app.post("/api/webhook/paystack",webhook)


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

// Schedule the function to run at 6 AM every day
cron.schedule('0 6 * * *', sendDailyDevotionReminder, {
  scheduled: true,
  timezone: "Africa/Lagos" // Replace 'Your/Timezone' with the appropriate timezone
});


// to declare port and isten to server  events
const PORT:string|number = process.env.PORT || 4000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT} at `+ new Date().toTimeString())
})



