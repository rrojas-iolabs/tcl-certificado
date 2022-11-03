'use strict';
const fs = require("fs");
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const PDFDocument = require("pdfkit");


function createCertificate(certificate, fileName, firma) {
  let doc = new PDFDocument({ size: "A4", margin: 50 });
  let file = fs.createWriteStream("/tmp/" + fileName);

  //Generacion del Certificado
  doc.pipe(file);
  generateHeader(doc, certificate);
  generateCustomerInformation(doc, certificate);
  generateDetail(doc, certificate);
  generateSignature(doc, certificate, firma);
  generateFooter(doc, certificate);
  doc.end();

  file.on("finish", function () {
    const stats = fs.statSync("/tmp/" + fileName);
    console.log("Nombre : " + "/tmp/" + fileName);

    s3.putObject({
      Bucket: process.env.CERT_BUCKET,
      Key: "certificado/" + fileName,
      Body: fs.createReadStream("/tmp/" + fileName),
      ContentType: "application/pdf",
      ContentLength: stats.size,
    }, function (err) {
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log("Terminado");
      }
    });
  });


}

function generateHeader(doc, certificate) {
  doc
    .fontSize(10)
    .text("Santiago " + certificate.fecha, 200, 50, { align: "right" })
    .moveDown();
}

function generateCustomerInformation(doc, certificate) {
  doc
    .fontSize(10)
    .text("Señores", 50, 160)
    .font('Helvetica-Bold').text(certificate.razonSocial, 50, 172)
    .font('Helvetica').text("Presente", 50, 190);
}

function generateDetail(doc, certificate) {
  doc
    .fontSize(10)
    .text("De nuestra consideración:", 50, 250)
    .text("Por medio del presente documento, Toyota Chile S.A. certifica que la unidad " + certificate.modelo + ", año " + certificate.anho + ", número de chasis identificado a continuación:", 50, 300)
    .font('Helvetica-Bold').text("Nº de Chasis ", 50, 350, { align: "center" })
    .font('Helvetica-Bold').text(certificate.chasis, 50, 370, { align: "center" })
    .font('Helvetica').text("Corresponden al modelo testeado por Latin NCAP en " + certificate.fechaTesteo + ", habiendo sido aprobada con " + certificate.cantidadPuntos + " puntos sobre " + certificate.totalPuntos + ".", 50, 400)
    .text("Se extiende el presente certificado a solicitud de " + certificate.razonSocial + " para ser presentado en faena minera " + certificate.minera + " con el fin de acreditar el ingreso del vehiculo a las dependencias de esta.", 50, 450)
    .text("Sin otro particular, se despide atentamente.", 50, 500)
  generateHr(doc, 365)
}

function generateSignature(doc, certificate, firma) {
  doc
    .image(firma, 220, 550, { width: 140, height: 100 })
    .font('Helvetica-Bold').text(certificate.nombreFirma, 50, 650, { align: "center" })
    .font('Helvetica-Bold').text("TOYOTA CHILE S.A.", 50, 670, { align: "center" })
}

function generateFooter(doc, certificate) {
  doc
    .font('Helvetica').text(certificate.codigoCertificado, 200, 780, { align: "right" })
}

function generateHr(doc, y) {
  doc
    .strokeColor("#000000")
    .lineWidth(1)
    .moveTo(260, y)
    .lineTo(340, y)
    .stroke()
}

function getS3Object(params) {
  return s3.getObject(params);
}

function getSignedUrl(params) {
  return s3.getSignedUrl('getObject', params);
}

module.exports = { createCertificate }