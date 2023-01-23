const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A price must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Tour name must have less than 40 chars'],
      minlength: [10, 'Tour name must have at least 10 chars'],
      // validate: [validator.isAlpha, 'name has to be alphanumeric'],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty should be easy, medium of difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'The rating cannot be below 1'],
      max: [5, 'Rating cannot be higher than 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A price must be provided'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        message: 'discount ({VALUE}) cannot be higher than price',
        validator: function (value) {
          //custom validator, which returns true or false, hence, the entry passes or doesn't
          //this refers to the document only if you create a NEW document
          return value < this.price;
        },
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'Provide a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'Provide an image for the tour'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ]
  },
  {
    toJSON: {
      virtuals: true,
      toObject: true,
    },
  }
);

//virtuals serve to create additional vars out of input vars
//we need to use the function (not arror func) in order to get the this keyword
//all math must be done in models rather than controllers - fat models - thin controllers approach
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//DOCUMENT MIDDLEWARE - serves to process document between creation .create and saving . save()
//the example shows the creation of var - slug - which is calced in middleware but features in the model from start
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
//the post middleware has access to the saved doc
tourSchema.post('save', function (doc, next) {
  next();
});

//QUERY MIDDLEWARE - serves to perform operations before and after find queries
//example - perform pre-filtering of data (give me tours ne to secretTour)
//this stands for query object, this middleware will run for any query starting with find
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});
tourSchema.post(/^find/, function (docs) {});

//AGGREGATION MIDDLEWARE - add processing before of after aggregation happens (Model.aggregate())
//this.pipeline() returns an array of aggregation operations
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
