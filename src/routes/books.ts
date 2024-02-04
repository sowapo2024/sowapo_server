const router = require('express').Router()
const books_controller = require('../controllers/books/books')
const {auth,adminAuth} = require('../middlewares/auth')
const {allMediaTypes} = require('../middlewares/handleImageMulter')


//create book
router.post('/create',adminAuth,allMediaTypes,books_controller.createBook)

// get all books
router.get("/get",books_controller.getAllBooks)

//get a book by ID
router.get("/get/:id",books_controller.getBookById)

//update book by id
router.put("/update/:id",adminAuth,books_controller.updateBook)

//delete book by id
router.delete ("/delete/:id",adminAuth,books_controller.deleteBook)

// buy a book
router.put("/buy/:id",books_controller.buyBook)



module.exports = router