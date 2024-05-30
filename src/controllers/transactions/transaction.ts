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

exports.getTransaction = async (req, res) => {
  try {
    const transactions = await Transaction.findById(req.params.transactionId);

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

exports.getInfluencerTransactions = async (req, res) => {
  if (req?.user?.id) {
    try {
      const influencer_transactions = await Transaction.find({ influencer: req?.user?.id });

      res
        .status(200)
        .json({ message: 'request sucessful', data: influencer_transactions });
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

exports.getBrandTransactions = async (req, res) => {
  if (req?.user?.id) {
    try {
      const brand_transactions = await Transaction.find({ brand: req?.user?.id });

      res
        .status(200)
        .json({ message: 'request sucessful', data: brand_transactions });
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
