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

const isValidURL = async (urlString) => {
  /*
  let url = null

  try {
    url = new URL(urlString)
  } catch (err) {
    return false;
  }

  return true;

  */
  return /^((http|https):\/\/)?([w|W]{3}\.)+[a-zA-Z0-9\-\.]{3,}\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/.test(urlString)
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.post('/api/shorturl', (req, res) => {
  isValidURL(req.body.url).then((valid) => {
    if (!valid) res.json({ error: 'invalid url' });
    generateRandomString().then((shortUrl) => {
      Urls.create({fullUrl: req.body.url, shortUrl: shortUrl}, (err, url) => {
        if (err) res.send(err);
        res.json({original_url : url.fullUrl, short_url : url.shortUrl});
      })
    })
  })
});

app.get('/api/shorturl/:shorturl', (req, res) => {
  Urls.findOne({shortUrl: req.params.shorturl}, (err, url) => {
    if (err) res.json({ error: 'invalid url' });
    res.redirect(url.fullUrl);
  })
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

module.exports = app;