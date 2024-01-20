const Transaction = require('../../models/transaction');
const { initiatePayments } = require('../../external-apis/paystack');

interface donationBody {
  amount: string;
  currency: string;
  email: string;
  type: string;
}

exports.makeDonation = async (req, res) => {
  let { amount, currency, email, type }: donationBody = req.body;

  try {
    if (amount && currency && email && type) {
      amount = String(Number(amount) * 100);

      const paymentResponse = await initiatePayments({
        email,
        amount,
        currency,
      });

      const { checkout_url, message, access_code, reference } = paymentResponse;

      const transaction = await Transaction.create({
        access_code,
        amount,
        message,
        reference,
        email,
        currency,
        type: type,
      });

      return res
        .status(200)
        .json({ data: { checkout_url }, message: 'donation url generated' });
    }
    else{
        return res.status(400).json({message:"provide all required fields"})
    }
  } catch (error) {
    return res.status(500).json({ message: 'something went wrong', error });
  }
};

exports.getAlldonations = async (req, res) => {
  try {
    const transactions = await Transaction.find({});

    const donations = transactions.filter((transaction) => {
      return transaction.type != 'book_purchase';
    });
    if (donations.length < 1) {
      return res
        .status(404)
        .json({ message: 'Transactions not found at the moment' });
    }
    return res
      .status(200)
      .json({
        data: donations,
        message: 'Transactions retrieved successfully ',
      });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error, message: 'Transactions retrieved successfully ' });
  }
};

// filter transactions

exports.filterDonations = async (req, res) => {
  try {
    let { sort, ...query } = req.query;

    // Sorting Result

    let sortList: [] | {};
    if (sort) {
      sortList = sort.split(',').map((s) => {
        const [field, order] = s.split(':');
        console.log(field, order);
        return [field, order === 'desc' ? -1 : 1];
      });
    } else {
      sortList = { createdAt: -1 };
    }
    const transactions = await Transaction.find(query)
      .sort(sortList)
    if (transactions.length <= 0) {
      return res
        .status(400)
        .json({ data: transactions, message: 'No item match your search' });
    }
    return res
      .status(200)
      .json({ data: transactions, message: 'fetched transactions sucesfully' });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: error, message: 'something went wrong' });
  }
};
