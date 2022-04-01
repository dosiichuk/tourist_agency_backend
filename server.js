const mongoose = require('mongoose');
const dotenv = require('dotenv');

//these are syncronous errors, resulting from programmatic mistakes
process.on('uncaughtException', (err) => {
  console.log(err.message, err.name);
  console.log('uncaught exception');
  // the process is killed
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection running');
  })
  .catch((err) => console.log(err));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

//handle unhandled promise rejection - errors occurring outside of express, e.g. database disfunction
process.on('unhandledRejection', (err) => {
  console.log(err.message, err.name);
  console.log('unhandled rejection');
  //first, we close the server, giving it time to process pending reqs, then the process is killed
  server.close(() => {
    //code 0 in brackets would stand for success, 1 - for unhandled error
    process.exit(1);
  });
});
