'use strict';
const fs = require("fs");
var path = require('path');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const certificate = require('./certificate');

exports.handler = function (event, callback) {

  const timestamp = Date.now();
  let fileName = "certificado" + timestamp + ".pdf";
  const params = { Bucket: process.env.RESOURCE_BUCKET, Key: "images/FirmaCertificado.jpg", ResponseContentType: 'image/jpg' }; // Firma debe venir por event


  var tempFileName = path.join('/tmp', 'firma' + timestamp + '.jpg');
  var tempFile = fs.createWriteStream(tempFileName);

  s3.getObject(params).createReadStream().pipe(tempFile);
  tempFile.on("finish", function () {
    certificate.createCertificate(event, fileName, tempFileName);
  });
}
