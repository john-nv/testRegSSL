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
  const { CA } = req.body;
  let CRT1_content = ''
  let CRT2_content = ''
  let token_content = ''
  try {
    // await commandExec()

    CRT1_content = fs.readFileSync('./CRT1.crt', 'utf8');
    CRT2_content = fs.readFileSync('./CRT2.crt', 'utf8');

    if (CRT2_content.length < 10) {
      console.log('Nội dung CRT2 không hợp lệ');
      return res.status(200).json({ status: false, CRT2: undefined, token: undefined });
    }

    token_content = CRT2_content + CRT1_content
    // console.log(token_content)

    const hexToken = stringToHex(token_content);
    console.log(hexToken)

    return res.status(200).json({ status: true, CRT2: CRT2_content, token: token_content })
  } catch (error) {
    console.log(error)
  }
})

function stringToHex(str) {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
}

async function commandExec(){
    console.log("time-before")
    exec('sudo date 051111111970');

    await sleep(500)
    console.log("OK.crs starting...")
    exec(`openssl req -new -sha256 -key ECgenpkey.key -out OK.csr -subj "/C=DE/ST=Bavaria/L=Vehicle/O=BMW AG/OU=Head Unit/CN=${CN}"`);
    
    await sleep(1000)
    console.log("CRT2.crt starting...")
    exec('openssl x509 -req -in OK.csr -CA CRT1.crt -CAkey privateKeyCRT1.pem -out CRT2.crt -sha256 -days 24820 -extfile extensions.cnf -extensions x509_ext');
    
    await sleep(1000)
    console.log("time-after")
    exec('sudo date 051111112024');
}

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

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