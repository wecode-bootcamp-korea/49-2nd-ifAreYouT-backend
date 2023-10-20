const express = require('express');
const { orderController } = require('../controllers');
const { verificateToken } = require('../middlewares')
const router = express.Router();

router.get("/", verificateToken, orderController.getUserOrder)


module.exports = router;