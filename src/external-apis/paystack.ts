const axios = require('axios');
const Transaction = require('../models/transaction');
const {
  sendBookReciept,
  sendDonationReciept,
} = require('../utils/mailer');



interface PaymentObject {
  email: string;
  amount: string;
  currency: 'NGN' | 'USD' | 'GBP';
};


interface PaymentResponse {
  checkout_url: string;
  message?: string;
  access_code: string;
  reference: string;
};

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
        transaction.sold +=1
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
};
