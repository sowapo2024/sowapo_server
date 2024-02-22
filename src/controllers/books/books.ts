const Book = require('../../models/book'); // Replace 'yourBookModel' with the actual file path of your model
const { initiatePayments } = require('../../external-apis/paystack');
const Transaction = require('../../models/transaction');
const mongoose = require("mongoose")

// Create Book
exports.createBook = async (req, res) => {
  try {
    const { title, author, callToAction, currency, amount,description } = req.body;

    // from the media middleware filter out files based on filetype
    // and  assign to relevant fields
    const cover_image = req.filePaths.filter(
      (file) => file.mimetype.split('/')[0] === 'image',
    )[0].path;
    const book_link = req.filePaths.filter(
      (file) => file.mimetype.split('/')[0] === 'application',
    )[0].path;

    const newBook = new Book({
      title,
      author,
      callToAction: callToAction || 'Buy book',
      currency,
      amount,
      cover_image,
      book_link,
      description
    });

    const savedBook = await newBook.save();

    res
      .status(201)
      .json({ data: savedBook, message: 'Book created successfully' });
  } catch (error) {
    console.error('Error in createBook:', error);
    res
      .status(500)
      .json({ error: error.message, message: 'Something went wrong' });
  }
};

// Read All Books
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res
      .status(200)
      .json({ data: books, message: 'Fetched all books successfully' });
  } catch (error) {
    console.error('Error in getAllBooks:', error);
    res
      .status(500)
      .json({ error: error.message, message: 'Something went wrong' });
  }
};

// Read Single Book
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json({ data: book, message: 'Fetched book successfully' });
  } catch (error) {
    console.error('Error in getBookById:', error);
    res
      .status(500)
      .json({ error: error.message, message: 'Something went wrong' });
  }
};

// Update Book
exports.updateBook = async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res
      .status(200)
      .json({ data: updatedBook, message: 'Book updated successfully' });
  } catch (error) {
    console.error('Error in updateBook:', error);
    res
      .status(500)
      .json({ error: error.message, message: 'Something went wrong' });
  }
};

// Delete Book
exports.deleteBook = async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res
      .status(200)
      .json({ data: deletedBook, message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error in deleteBook:', error);
    res
      .status(500)
      .json({ error: error.message, message: 'Something went wrong' });
  }
};

//buy_book

exports.buyBook = async (req, res) => {
  const { email} = req.body;

  try {
    const bookId = req.params.id;
    const book = await Book.findById(bookId);

    let {amount,currency}:{amount:string,currency:string} = book

    amount = String(Number(amount)*100) 

    if (book) {
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
        book: bookId,
        type: 'book_purchase',
        user: mongoose.Types.Schema.ObjectId(req?.user?.id)
      });

      return res
        .status(200)
        .json({ data: { checkout_url }, message: 'book purchase complete' });
    } else {
      return res.status(404).json({ message: 'book not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'something went wrong', error });
  }
};
