const router = require('express');
const dbController = require('../controllers/dbController');

const route = router();

route.post('/listDb', dbController.listDb);
route.post('/listDbData', dbController.listDbData);
route.post('/listDbDetails', dbController.listDbDetails)
route.post('/selectTable', dbController.selectTable);
route.post('/sqlfree', dbController.sqlfree);

module.exports = route;