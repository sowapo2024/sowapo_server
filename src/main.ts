const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const cron = require('node-cron');
const {
  sendPushNotification,
} = require('./external-apis/fcm_push_notification');
const { getAllPushTokens } = require('./external-apis/push-notification');
const initializeSocket = require('./socket');

// initializing routes
const influencerRouter = require('./routes/influencer');
const brandRouter = require('./routes/brand');
const postRouter = require('./routes/posts');
const announcementRouter = require('./routes/announcement');
const adminRouter = require('./routes/admin');
const webhookRouter = require('./routes/webhook');
const transactionRouter = require('./routes/transaction');
const campaignRouter = require('./routes/campaigns');
const proposalRouter = require('./routes/proposal');
const chatRouter = require('./routes/chat');
const taskRouter = require('./routes/task');

const feedbackRouter = require('./routes/feedback');

// importing paystack webhook
const { webhook } = require('./external-apis/paystack');

const app = express();

// calling the socket instance
const server = http.createServer(app);
const io = initializeSocket(server);

// for body-parser middleware
app.use(express.json());

// morgan logger for dev
app.use(logger('dev'));

// make our upload an accessible folder
app.use('/tmp/uploads', express.static('uploads'));

app.use(express.urlencoded({ extended: false }));

// cors configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept,x-auth-token',
  );
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Database URI
let dbURI;

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
  dbURI = process.env.DB_URI;
} else {
  dbURI = process.env.DB_URI;
}

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Test database connection
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Database connected successfully...');
});

// Set up our main routes
app.use('/api/influencers', influencerRouter);
app.use('/api/brands', brandRouter);
app.use('/api/posts', postRouter);
app.use('/api/announcements', announcementRouter);
app.use('/api/admin', adminRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/proposals', proposalRouter);
app.use('/api/chats', chatRouter);
app.use('/api/tasks', taskRouter);

app.use('/api/feedbacks', feedbackRouter);

// Set up webhook endpoint for Paystack
app.post('/api/webhook/paystack', webhook);

// Error handling middleware
app.use((req, res, next) => {
  const error: any = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    message: error.message,
  });
});

// Schedule tasks with cron
// cron.schedule('0 6 * * *', sendDailyDevotionReminder, {
//   scheduled: true,
//   timezone: "Africa/Lagos"
// });

// test notification

async function testNotification() {
  try {
    const tokens = await getAllPushTokens();
    await sendPushNotification({
      registrationTokens: tokens,
      title: 'test  notification',
      body: 'this is a test body',
    });
    console.log('token sent', tokens);
  } catch (error) {
    console.log(error);
  }
}

testNotification();

// Declare port and listen to server events
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} at ` + new Date().toTimeString(),
  );
});
