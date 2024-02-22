const Transaction = require('../../models/transaction');

exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({});

    res
      .status(200)
      .json({
        message: 'request sucessful; transactions fetched',
        data: transactions,
      });
  } catch (error) {
    console.log(error, 'get all transactions error log');
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

exports.getUserTransactions = async (req, res) => {
  if (req?.user?.id) {
    try {
      const user_transactions = await Transaction.find({ user: req?.user?.id });

      res
        .status(200)
        .json({ message: 'request sucessful', data: user_transactions });
    } catch (error) {
      console.log(error, 'get all transactions error log');
      res.status(500).json({ message: 'Something went wrong', error });
    }
  } else {
    res
      .status(403)
      .json({ message: 'Request header contains no id, try loggin in again' });
  }
};
