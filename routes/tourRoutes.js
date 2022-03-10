const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

// router.param('id', tourController.checkID);

//create a checkbody function
//check whether tour data contains name and price data for tour
//otherwise send 400 status

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
