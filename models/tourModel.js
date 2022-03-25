const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A price must have a name'],
      unique: true,
      trim: true,
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
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A price must be provided'],
    },
    priceDiscount: Number,
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

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
