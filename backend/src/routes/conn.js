const router = require('express');
const dbConnController = require('../controllers/dbConnController');
const route = router();

route.get('/list', dbConnController.list);

module.exports = route;