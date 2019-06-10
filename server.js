const express = require('express');
const rateLimit = require("express-rate-limit");

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

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
