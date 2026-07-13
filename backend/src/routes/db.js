const router = require('express');
const dbController = require('../controllers/dbController');

const route = router();

route.post('/listDb', dbController.listDb);
route.post('/listTable', dbController.listTable);
route.post('/selectTable', dbController.selectTable);
route.post('/sqlfree', dbController.sqlfree);

module.exports = route;