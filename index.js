const express = require('express');
const router = require('express-imp-router');
const path = require('path');

const app = express();

const imp = require('./import');
const routes = imp.import();

console.log(routes['/api']['/campaign']['/:campaignId']['/shootPressure'])

router(app);
router.enableDebug()
router.route([
  {
    controllers: `${path.resolve('.')}/controllers`,
    routes,
  }
]);

app.listen(8089)
