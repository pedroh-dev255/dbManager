const router = require('express');
const dbConnController = require('../controllers/dbConnController');
const route = router();

route.get('/list', dbConnController.list);
route.post('/create', dbConnController.create);

module.exports = route;