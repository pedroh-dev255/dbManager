const router = require('express');
const authController = require("../controllers/authController");

const route = router();

route.post('/login', authController.login);


module.exports = route;