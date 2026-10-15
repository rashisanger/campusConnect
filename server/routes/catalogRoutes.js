const express = require('express');
const { body, param } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const catalogController = require('../controllers/catalogController');

const router = express.Router();
const categoryId = param('categoryId').isMongoId().withMessage('Category ID is invalid.');
const venueId = param('venueId').isMongoId().withMessage('Venue ID is invalid.');
const categoryFields = [
  body('name').optional().isString().trim().notEmpty().isLength({ max: 80 }),
  body('description').optional().isString().trim().isLength({ max: 500 })
];
const requiredCategoryName = body('name').isString().trim().notEmpty()
  .withMessage('Category name is required.').isLength({ max: 80 });
const venueFields = [
  body('name').optional().isString().trim().notEmpty().isLength({ max: 120 }),
  body('building').optional().isString().trim().isLength({ max: 120 }),
  body('room').optional().isString().trim().isLength({ max: 80 }),
  body('address').optional().isString().trim().isLength({ max: 300 }),
  body('coordinates').optional().isObject(),
  body('coordinates.lat').optional().isFloat({ min: -90, max: 90 }).toFloat(),
  body('coordinates.lng').optional().isFloat({ min: -180, max: 180 }).toFloat(),
  body('coordinates').optional().custom((coordinates) => {
    if (coordinates.lat === undefined || coordinates.lng === undefined) {
      throw new Error('Provide both latitude and longitude.');
    }
    return true;
  })
];
const requiredVenueName = body('name').isString().trim().notEmpty()
  .withMessage('Venue name is required.').isLength({ max: 120 });

router.get('/categories', catalogController.listCategories);
router.get('/venues', catalogController.listVenues);

router.get('/admin/categories', authenticate, authorize('admin'), catalogController.listCategories);
router.post('/admin/categories', authenticate, authorize('admin'), requiredCategoryName, categoryFields, validateRequest, catalogController.createCategory);
router.put('/admin/categories/:categoryId', authenticate, authorize('admin'), categoryId, categoryFields, validateRequest, catalogController.updateCategory);
router.delete('/admin/categories/:categoryId', authenticate, authorize('admin'), categoryId, validateRequest, catalogController.deleteCategory);

router.get('/admin/venues', authenticate, authorize('admin'), catalogController.listVenues);
router.post('/admin/venues', authenticate, authorize('admin'), requiredVenueName, venueFields, validateRequest, catalogController.createVenue);
router.put('/admin/venues/:venueId', authenticate, authorize('admin'), venueId, venueFields, validateRequest, catalogController.updateVenue);
router.delete('/admin/venues/:venueId', authenticate, authorize('admin'), venueId, validateRequest, catalogController.deleteVenue);

module.exports = router;
