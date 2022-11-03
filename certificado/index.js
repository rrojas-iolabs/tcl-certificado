const fs = require("fs");
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const PDFDocument = require("pdfkit");
var path = require('path');


exports.lambdaHandler = function (event, callback) {
  const timestamp = Date.now();
  //let fileName = "certificado" + timestamp + ".pdf";
  let fileName = "certificado" + ".pdf";
  const params = { Bucket: "s3://certificado-lncap-resources/images/", Key: "images/FirmaIgnacio.jpg",ResponseContentType: 'image/jpg' };
 // let imageUrl =  getSignedUrl(params);

var tempFileName = path.join('/tmp', 'firma.jpg');
var tempFile = fs.createWriteStream(tempFileName);

s3.getObject(params).createReadStream().pipe(tempFile);
tempFile.on("finish", function () {
  createCertificate(event,fileName,tempFileName);
});
} 

function createCertificate(certificate, fileName,firma) {
  let doc = new PDFDocument({ size: "A4", margin: 50 });
  let file = fs.createWriteStream("/tmp/" + fileName);
  
  doc.pipe(file);
  generateHeader(doc, certificate);
  generateCustomerInformation(doc, certificate);
  generateDetail(doc, certificate);
  generateSignature(doc, certificate,firma);
  generateFooter(doc, certificate);
  doc.end();

  file.on("finish", function () {
    const stats = fs.statSync("/tmp/" + fileName);
    console.log("Nombre : " + "/tmp/" + fileName);
    
    s3.putObject({
      Bucket: "s3-certificate-tcl",
      Key: "certificate/" + fileName,
      Body: fs.createReadStream("/tmp/" + fileName),
      ContentType: "application/pdf",
      ContentLength: stats.size,
    }, function (err) {
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log("Terminado, Agregar Out");
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
    .text(certificate.razonSocial, 50, 172)
    .text("Presente", 50, 190);
}

function generateDetail(doc, certificate) {
  doc
    .fontSize(10)
    .text("De nuestra consideración:", 50, 250)
    .text("Por medio del presente documento, XXXXX Chile S.A certifica que la unidad " + certificate.modelo + ", año " + certificate.anho + ", número de chasis identificado a continuación:", 50, 300)
    .font('Helvetica-Bold').text("Nº de Chasis ", 50, 350, { align: "center" })
    .font('Helvetica-Bold').text(certificate.chasis, 50, 370, { align: "center" })
    .font('Helvetica').text("Corresponden al modelo testeado por Latin NCAP en " + certificate.fechaTesteo + ", habiendo sido aprobada con " + certificate.cantidadPuntos + " puntos sobre " + certificate.totalPuntos + ".", 50, 400)
    .text("Se extiende el presente certificado a solicitud de " + certificate.razonSocial + " para ser presentado en faena minera " + certificate.minera + " con el fin de acreditar el ingreso del vehiculo a las dependencias de esta.", 50, 450)
    .text("Sin otro particular, se despide atentamente.", 50, 500)
  generateHr(doc, 365)
}

function generateSignature(doc, certificate,firma) {
  doc
    .image(firma,220,550, {width: 140, height: 100})
    .text(certificate.nombreFirma, 50, 650, { align: "center" })
    .text("XXXXX CHILE S.A.", 50, 670, { align: "center" })
}

function generateFooter(doc, certificate) {
  doc
    .text(certificate.codigoCertificado, 200, 780, { align: "right" })
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
  // agregue temp
  return s3.getSignedUrl('getObject', params);
}
