const forge = require('node-forge');
const fs = require('fs');
const EC = require('elliptic').ec;

// const privateKeyData = fs.readFileSync('ECgenpkey.key', 'utf8');
// const privateKey = forge.pki.privateKeyFromAsn1(privateKeyData)


// // Tạo một CSR
// const csr = forge.pki.createCertificationRequest();
// csr.publicKey = privateKey.publicKey;

// // Thiết lập các trường trong chứng chỉ yêu cầu
// csr.setSubject([
//     { name: 'countryName', value: 'DE' },
//     { name: 'stateOrProvinceName', value: 'Bavaria' },
//     { name: 'localityName', value: 'Vehicle' },
//     { name: 'organizationName', value: 'BMW AG' },
//     { name: 'organizationalUnitName', value: 'Head Unit' },
//     { name: 'commonName', value: '6749050753D90095C9E603CA1A7E5F0D4A524E8AB0C277145AE6F7556FB37BE8' }
// ]);

// // Ký chứng chỉ yêu cầu bằng khóa riêng tư
// csr.sign(privateKey);

// // Lưu chứng chỉ yêu cầu vào một tệp
// const csrData = forge.pki.certificationRequestToPem(csr);
// fs.writeFileSync('OK.csr', csrData);


const { exec } = require('child_process');

const command1 = `openssl req -new -sha256 -key ECgenpkey.key -out OK.csr -subj "/C=DE/ST=Bavaria/L=Vehicle/O=BMW AG/OU=Head Unit/CN=6749050753D90095C9E603CA1A7E5F0D4A524E8AB0C277145AE6F7556FB37BE8"`;

const command2 = `openssl x509 -req -in OK.csr -CA CRT1.crt -CAkey privateKeyCRT1.pem -out CRT2.crt -sha256 -days 22995`;


setTimeout(()=>{
  exec(command1);
},1000)

setTimeout(()=>{
  exec(command2);
},5000)