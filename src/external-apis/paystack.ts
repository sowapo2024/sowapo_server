const axios = require('axios');
const Transaction = require('../models/transaction');
const { sendBookReciept, sendDonationReciept } = require('../utils/mailer');
const Subscription = require('../models/subscription');
const Influencer = require('../models/Influencer');
const otpGenerator = require('otp-generator');

interface PaymentObject {
  email: string;
  amount: string;
  currency: 'NGN' | 'USD' | 'GBP';
}

interface PaymentResponse {
  checkout_url: string;
  message?: string;
  access_code: string;
  reference: string;
}

// paystack function to initialize a transaction
const initiatePayments = async (
  paymentObject: PaymentObject,
): Promise<PaymentResponse> => {
  try {
    const response = await axios.post(
      `${process.env.PAYSTACK_BASE_URL}/transaction/initialize`,
      paymentObject,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.PAYSTACK_TEST_KEY}`,
        },
      },
    );

    if (response) {
      const responseData = response.data;
      const { data, message } = responseData;
      return {
        checkout_url: data.authorization_url,
        message: message,
        access_code: data.access_code,
        reference: data.reference,
      };
    } else {
      throw new Error('something went wrong while making request');
    }
  } catch (error) {
    console.error('Error initializing payment:', error.response.data);
    throw new Error('Failed to initialize payment');
  }
};

interface singleTransferObject {
  amount: string | number;
  recipient: string;
  currency:string;
  reason:string;
}

// Function to handle single transfers
const singleTransfer = async ({ amount, recipient, currency ,reason}: singleTransferObject) => {
  let otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });

  let reference = `swp_${otp}`;
  let referenceExists = await Transaction.findOne({ reference });

  // Loop until a unique reference is generated
  while (referenceExists) {
    otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    reference = `swp_${otp}`;
    referenceExists = await Transaction.findOne({ reference });
  }

  const params = {
    source: 'balance',
    amount: amount,
    reference: reference,
    recipient: recipient,
    reason: reason||'influencer payout',
    currency: currency
  };

  axios.post(`${process.env.PAYSTACK_BASE_URL}/transfer`, params, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_TEST_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  .then((response) => {
    const {data,message} = response
    return {
      message,
      reference: data.reference,
      transfer_code:data.transfer_code
    }
  })
  .catch((error) => {

    console.log("single transfer failed")
    throw error
  });
};



// Define TypeScript interfaces for clarity and type safety
interface Transfer {
  amount: number;
  recipient: string;
  reference?: string;
  reason?: string;
}

interface BulkTransferParams {
  currency: string;
  source: string;
  transfers: Transfer[];
}

interface BulkTransferResponse {
  message: string;
  data: any;  // Consider specifying a more detailed type based on the expected structure of 'data'
}
const bulkTransfer = async (transfers: Transfer[], currency: string = "NGN", source: string = "balance"): Promise<BulkTransferResponse> => {
  const params: BulkTransferParams = {
    currency,
    source,
    transfers
  };

  try {
    const response = await axios.post('https://api.paystack.co/transfer/bulk', params, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_TEST_KEY}`,  // Ensure your secret key is safely stored in environment variables
        'Content-Type': 'application/json'
      }
    });
    
      const {data,message} = response
      return {
        message,
        data
      }
    

  } catch (error) {
    console.error('Failed to perform bulk transfer:', error);
    throw error
  }
};


interface recipientParams {
  type: string,
  name: string,
  account_number: string,
  bank_code: string,
  currency: string
}

interface createRecipientResponse {
  message: string;
  data: any;  // Consider specifying a more detailed type based on the expected structure of 'data'
}
const createRecipient = async ({params}:{params:recipientParams}): Promise<createRecipientResponse> => {


  try {
    const response = await axios.post('https://api.paystack.co/transferrecipient', params, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_TEST_KEY}`,  // Ensure your secret key is safely stored in environment variables
        'Content-Type': 'application/json'
      }
    });
    
      const {data,message} = response
      return {
        message,
        data
      }
    

  } catch (error) {
    console.error('Failed to perform bulk transfer:', error);
    throw error
  }
};


// this controller listens to events from paystack webhook
const webhook = async (req, res) => {
  const body = req.body;

  try {
    if (body?.event === 'charge.success') {
      const { data } = body;
      const reference = data?.reference;

      // ensure transaction exists in the database
      const transaction = await Transaction.findOne({ reference });

      if (transaction) {
        // update transaction status to successful
        transaction.status = 'successful';
        transaction.sold += 1;
        await transaction.save();

        // send receipts based on the transaction type
        if (transaction.type === 'book_purchase') {
          await transaction.populate('book');
          await sendBookReciept({
            email: transaction.email,
            amount: transaction.amount,
            attachments: [{ path: transaction.book.book_link }],
          });
        } else if (
          transaction.type === 'offering' ||
          transaction.type === 'tithe'
        ) {
          await sendDonationReciept({
            email: transaction.email,
            amount: transaction.amount,
          });
        } else if (transaction.type === 'influencer_subscription') {
          const subscription = await Subscription.create({
            startDate: Date.now(),
            endDate: Date.now() + 365 * 24 * 60 * 60 * 100,
            user: req.user.id,
            transaction: transaction._id,
          });
          await Influencer.findByIdAndUpdate(transaction.inflencer, {
            subscription: subscription._id,
          });
        }
        return res
          .status(200)
          .json({ message: 'Webhook processed successfully' });
      } else {
        return res.status(400).json({ message: 'Transaction not found' });
      }
    } else {
      return res.status(200).json({ message: 'Webhook event ignored' });
    }
  } catch (error) {
    console.error('Error in webhook processing:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  initiatePayments,
  webhook,
  singleTransfer,
  bulkTransfer,
  createRecipient
};
