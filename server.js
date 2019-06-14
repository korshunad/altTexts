const express = require('express');
const rateLimit = require("express-rate-limit");

const cheerio = require('cheerio');
const url = require('url');
const puppeteer = require('puppeteer');

require('dotenv').config()
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const PORT = process.env.PORT || 7777;

const bodyParser = require('body-parser')

const app = express();
const vision = require('@google-cloud/vision');

const client = new vision.ImageAnnotatorClient();
const image2base64 = require('image-to-base64');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

app.use(bodyParser());

app.get('/get-alt', (req, res) => {
  image2base64(decodeURIComponent(req.query.src))
    .then(
      (response) => {
        client
          .annotateImage({
            "image":{
              "content":response
            },
            "features":[
              {
                "type":"LABEL_DETECTION",
                "maxResults":5
              }
            ]
          })
          .then(results => {
            if (results[0].error) {
              return res.send('noALT');
            } else {
              const labels = results[0].labelAnnotations;

              let altTexts;
              if (labels.some(label => label.topicality > 0.9)) {
                altTexts=labels.filter(label=> {
                  label.topicality > 0.9
                });
              } else {
                altTexts=labels;
              }
              altTexts=altTexts.map(label => label.description);
              return res.send(altTexts);
            }
          })
          .catch(() => {
            return res.send('noALT');
          });
      }
    )
    .catch(
      (error) => {
        console.log(error);
      }
    )
});

app.get('/get-images', (req, res) => {
  const url_to_parse = decodeURIComponent(req.query.url);
  let results = [];
  puppeteer
    .launch()
    .then(function(browser) {
      return browser.newPage();
    })
    .then(function(page) {
      return page.goto(url_to_parse).then(function() {
        return page.content();
      });
    })
    .then(function(html) {
      const $ = cheerio.load(html);

      $("img").each(function(i, image) {

        results.push(url.resolve(url_to_parse, $(image).attr('src')));
      });

      return res.send(results);
    })
    .catch(function(err) {
      //handle error
    });

});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
