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
app.use('/public', express.static(__dirname + '/public'))

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
  return Math.round(Math.random() * (maxValue - minValue) + minValue);
}
const generateRandomString = async (length = getRandomValue(8, 12)) => {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let charactersLength = characters.length;
  let randomString = '';

  for (let i = 0; i < length; i++) {
    randomString += characters.substr(getRandomValue(0, charactersLength - 1), 1);
  }

  return randomString;
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.post('/api/shorturl', (req, res) => {
  generateRandomString().then((shortUrl) => {
    Urls.create({fullUrl: req.body.url, shortUrl: shortUrl}, (err, url) => {
      if (err) res.status(500).send(err);
      res.sendStatus(200).json({original_url : url.fullUrl, short_url : url.shortUrl});
    })
  });
});

app.get('/api/:shortId', (req, res) => {
  Urls.findOne({shortUrl: req.params.shortId}, (err, url) => {
    if (err) res.status(500).json({ error: 'invalid url' });
    res.redirect(url.fullUrl);
  })
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

module.exports = app;