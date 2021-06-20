require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const { Schema } = mongoose;

app.use(helmet());
app.use(bodyParser.urlencoded({"extended": false}));
app.use(bodyParser.json());
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

mongoose.connect(`${process.env.MONGO_URI}`,{
  useNewUrlParser: true, 
  useUnifiedTopology: true
});

const urlSchema = new Schema({
   fullUrl:  {type: String, required: true},
   shortUrl: {type: String, required: true, index: true, unique: true},
   created:  {type: Date, default: Date.now()}
});

const Urls = mongoose.model('Urls', urlSchema);

const getRandomValue = (minValue, maxValue) => {
  return Math.random() * (maxValue - minValue) + minValue;
}
const generateRandomString = (length = getRandomValue(8, 12)) => {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let charactersLength = characters.length;
  let randomString = '';

  for (let i = 0; i < length; i++) {
    randomString += characters[getRandomValue(0, charactersLength - 1)];
  }

  return randomString;
}

app.post('/short', (req, res) => {
  let shortUrl = generateRandomString();
  Urls.create({fullUrl: req.body.fullUrl, shortUrl: shortUrl}, (err, url) => {
    if (err) res.status(500).send(err);
    res.sendStatus(200);
  })
});

app.get('/:shortUrl', (req, res) => {
  Urls.findOne({shortUrl: req.params.shortUrl}, (err, url) => {
    if (err) res.status(500).send(err);
    res.redirect(url.fullUrl);
  })
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

module.exports = app;