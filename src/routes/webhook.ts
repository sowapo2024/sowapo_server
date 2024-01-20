const router = require("express").Router()

const {webhook}= require("../external-apis/paystack")


router.post("/paystack",webhook)

module.exports = router