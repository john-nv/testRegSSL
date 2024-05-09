const { exec } = require('child_process');
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const forge = require('node-forge');
const fs = require('fs');

const PORT = 3301

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

server.listen(PORT, () => { console.log(`Server is running on ${PORT}`) })

app.use(express.urlencoded({ extended: true }))

app.post('/regKey', async  (req, res) => { 
  const { CN } = req.body;
  let CRT1_content = ''
  let CRT2_content = ''
  let token_content = ''
  try {
    await commandExec(CN)

    CRT1_content = fs.readFileSync('./CRT1.crt', 'utf8');
    CRT2_content = fs.readFileSync('./CRT2.crt', 'utf8');

    if (CRT2_content.length < 10) {
      console.log('Nội dung CRT2 không hợp lệ');
      return res.status(200).json({ status: false, tokenHex: undefined, tokenHexReady: undefined });
    }

    token_content = CRT2_content + CRT1_content
    fs.writeFileSync('./token.pem', token_content, 'utf8');
    await sleep(100)

    const TokenCRT = fileToHex('./token.pem')
    fs.writeFileSync('./token.pem', '', 'utf8');

    const TokenCRTReady = addHexBeforeToken(TokenCRT.hex)

    return res.status(200).json({ status: true, tokenHex: TokenCRT.hex, tokenHexReady: TokenCRTReady })
  } catch (error) {
    console.log(error)
  }
})

function fileToHex(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let hex = '';
    for (let i = 0; i < fileContent.length; i++) {
      hex += fileContent.charCodeAt(i).toString(16).padStart(2, '0');
    }

    return {
      hex: hex.toUpperCase(),
      contentFile: fileContent
    }
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
}

async function commandExec(CN){
    console.log("set-ntp")
    exec('sudo timedatectl set-ntp off');
    await sleep(500)
    console.log("set-time")
    exec('sudo date 051111111970');

    await sleep(500)
    console.log("OK.crs starting...")
    exec(`openssl req -new -sha256 -key ECgenpkey.key -out OK.csr -subj "/C=DE/ST=Bavaria/L=Vehicle/O=BMW AG/OU=Head Unit/CN=${CN}"`);

    await sleep(1000)
    console.log("CRT2.crt starting...")
    exec('openssl x509 -req -in OK.csr -CA CRT1.crt -CAkey privateKeyCRT1.pem -out CRT2.crt -sha256 -days 24820 -extfile extensions.cnf -extensions x509_ext');
    
    await sleep(500)
    exec('sudo timedatectl set-ntp on');
}

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

function decimalToHexSigned(decimal, bitLength = 16) {
  let hex = decimal.toString(16).toUpperCase();
  while (hex.length < bitLength / 4) {
      hex = "0" + hex;
  }
  
  const maxPosValue = Math.pow(2, bitLength - 1) - 1;
  if (decimal < 0 && decimal >= -maxPosValue) {
      const maxNegValue = Math.pow(2, bitLength) - 1;
      const negHex = (maxNegValue + decimal + 1).toString(16).toUpperCase();
      return negHex;
  }
  
  return hex;
}

function addHexBeforeToken(tokenValue){
  let number = ( tokenValue.length / 2 ) + 6
  const hexSigned = decimalToHexSigned(number)
  console.log(number)
  console.log(hexSigned)
  const HexBefore = `0000${hexSigned}0001F4633101A0FD${tokenValue}`
  return HexBefore
}

// openssl req -new -sha256 -key ECgenpkey.key -out OK.csr -subj "/C=DE/ST=Bavaria/L=Vehicle/O=BMW AG/OU=Head Unit/CN=EA133E84B57A4DEB8F1C0A8F7D051B11AFEFA545E51B1B6119DE937028131584"
// openssl x509 -req -in OK.csr -CA CRT1.crt -CAkey privateKeyCRT1.pem -out CRT2.crt -sha256 -days 24820 -extfile extensions.cnf -extensions x509_ext
// openssl x509 -req -in OK.csr -CA CRT1.crt -CAkey privateKeyCRT1.pem -out CRT2.crt -sha256 -days 24820 -extfile extensions.cnf -extensions x509_ext -config template.conf
// openssl x509 -req -in OK.csr -CA CRT1.crt -CAkey privateKeyCRT1.pem -out CRT2.crt -sha256 -days 24820 -config template.conf
// openssl x509 -req -in OK.csr -CA CRT1.crt -CAkey privateKeyCRT1.pem -out CRT2.crt -days 24820 -extfile extensions.cnf -extensions x509_ext -extfile template.conf
// openssl x509 req -extfile validity.ext -in OK.csr -out extended_OK.csr
// openssl x509 -text -noout -in CRT2.crt

// sudo timedatectl set-ntp on
// sudo date 051111111970

// setTimeout(()=>{
//   console.log("time-before")
//   exec('sudo date 051111111970');
// },500)

// setTimeout(()=>{
//   console.log("OK.crs starting...")
//   exec(`openssl req -new -sha256 -key ECgenpkey.key -out OK.csr -subj "/C=DE/ST=Bavaria/L=Vehicle/O=BMW AG/OU=Head Unit/CN=${CN}"`);
// },500)

// setTimeout(()=>{
//   console.log("CRT2.crt starting...")
//   exec('openssl x509 -req -in OK.csr -CA CRT1.crt -CAkey privateKeyCRT1.pem -out CRT2.crt -sha256 -days 24820 -extfile extensions.cnf -extensions x509_ext');
// },2000)

// setTimeout(()=>{
//   console.log("time-after")
//   exec('sudo date 051111112024');
// },2500)


// apt install systemd-timesyncd
// timedatectl set-ntp true