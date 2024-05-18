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

app.post('/regKeyv2', async  (req, res) => { 
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

app.get('/mgu1', (req,res) =>{
  res.json({
    sys: "PH5CdzlmKUJ3OWlYRHFaWjFFTzFpfUVKWTxiRUxjYnpFJT1TOERxMkBkRHFJYWNCdzlmKUJ3cUwjRkloWE1EJmFnNkl5IXgpRFJBZipEIWR8WEVuVjYoSWBAPGBDUWJPZ0k9LXVfRzFVeVdHMipze0IpXlRPRmg7ZjdCWXxmQUl5Y2lBQjs+OSVJQDZmYEU1UG9hSUBCVERFJTx6YEpZMD1RSXtXZz1GSSY0XkllY21nRjY2NUBGNHJCJkk9bCVgQ1ZeaXdFJX5wI0U1UkI3SUR0cm9GNTtDSEVuOTB7RzNOWS1JY3pTNURSQlZyQi00bFRFJT5YPkIrLSM9Q3RMWEFCc2R6LUk9bGZGQ1J+TEZCPT9DQUQqUEdrSXtQTFdDdE1CJkQmelpISVhMaFpJWExVX0pVUGkwRHNfMmlJXiZFdEI+MUFAQ1VuK29GNTsxQkJSSyRARG8lWn1Ec15HJkU0e0p2RCR8dDhDdHY3MUlYOEleSWNqRCVFNzZza0QlU3cxRU9wdzZFI2dxPEZJaFg3RiNQe2ZEIWRXMEItUVZ5RFJkR1FCWXwmTUVwaGlkSVpma1JGISsyKEVMZHYzRW1fWEJJWldnM0p6RWBVRWtqdEdDUzdNVURzK1grRG95LWNKYmclQ0JSQ1NgSmJofHtEJTdJKERxcnhjRkkmNF5JZT9gZkI9KWwtQ3JjVGRFT05sZEJSN0YwSXtYWk1Ec19EQEYhYCVHSXtPUSZFTHR2d0pVNGpiSUBTQ1ZKYn4zeEY1I3xpRiEhT1JKYj5ZfkUjeDVgRXBwUDFFblVnaUleenR5SXtYJHhGbCk8REl7UExXSkFHbVRGOEx+bUpBZz1YSlk5WFBFI3ZlUUZsYkxNRCt2ZUxKQXowWkRvaGJvSUJJRzNGNjZ0WklYN24wSkFoX3ZEb3g1ekRPX1djSXlNZCZET191bUcxOTdzRiEtayVKYml3LUN0ZFcrRmhoUnFGSWhYSEpZOVRfRFA0Vm1EcUhrQUl5ZWR5RFBRPGZHNTQ3YEQmcWdfSUIzVjJFT3ljWElEbE4rRSZVIXFFa2FsV0I9PzxOSkF6bihGNFpRYkU1NEJxRHNtRFFFbjhDaUpBcEw2RHFYIV5KV2NkTEZJJjReSWVAeWJKYiVMIUlefmZMRW5ufGVGOE1zO0Y1Izx5SXtYPThDUn1zRkk/OyhlRCY/YWVKeHRsaEJSVDc3RU9HRTJCc3RDRkQqT097Qitgd2JEOENqJkp4XipnRzIqZjBJQFNuLURveWs1SlVQLS1Je1BMV0U3Uio7RSVnemBFT1hKKkljSEVOSWF3X29EKk9CN0p6TWl5RTVaUDdGOEtfREllbCh+RFBZbytJeU0hSURxWnxKRmx0WSFCc2w8SUJSQlpXRFJBKDVEOFZLMUQlN3U8SVpXMHJDVXk4SEk9O1dhRkloWEVHMzFTP0VPeUVzQ1M3WipKQVhfe0lCWVJmRzMxRkFEJVNIM0RvZ3owRE9sc3pKVVpGb0VwcTUlSURJPWBFa2t5cklhe3xvQ3JiKXRETWQoRkVwPUJaRCRmejNEcXM2MUlYTClBQilsNEdGSSY0XkllYnZsSVp5UHZJYF5UKklCM0hLQll9T0RHNXNRVkRPYG1iRzE5WV9DUzYtZ0lgXiteRU9Za35Dcmt2bkpiaCt5Qi1BUDhFbkVndEY2NExjRTVBcUZCLUFSdUZsSkNBSWdWM0VJPjRoQUY0SUlLSXtQTFdGOHZrKElab1pJRHFZc1NGNTtCKkI/ZEQ/Q1FSZkNFayhsZEU4PztARmxibTBEcXM5I0Q3flMtSWYzMCRKV0J1TUUjd2YoSXtIWUhCKV8rV0llbHYxRiRvP0tKVVklYEljYSoxQ1J8MklFbkZIO0ZJaFhzQnNMQn5DU0NOI0QhZFdWRU95Y0RGOFVHJEc1cnZqSUJQWXdDdHUyN0pZRSlvSnhsMClGbHRQZEZsdFBaRUx0Zk9JYXxqb0lhZiRtQ09aNXlGIzNSPkVwJV5QSldTYz5JXiZWNkl7MXZpRkkmNF5JZjMwa0Vub0swRzIoQ25GNFowfEVwRnE8SWNYZ0ZFITJAakYkb1ooRzFucSREc2I+IUVQLU5ARzVaSipHNiNgakU5VW9KSldjPmxFTzFJRUpXQX03Q3JiMnZEJTdffUZ9fC0hRFBaZ1RKQmBfMEl7UExXQ1VueEhJQSpTSUQhI1goRSN3VExJP31WYkZsYktjSlg/SkRJYWZafEVMYyFhRWt6TDFJezErYEpXZEtZSldTRlpJZSo3MkNVZit5SmIka09Cc2xRbEI+MXtURShySlREUz4lbkpZVmJ0RjhFT09GSWhYcklePUwzRjUkMERKWVUqUUlaR25oSURRIzlCPlVAMEYkbi1xST98QndJWmd4cUVwbzxuSWFmQ1dJezNFbEVublNiQjt9UkJEJD1KM0UlJXYqSXtGJXZKek1+Q0U3Ql5PQ1FCQU5EUnNTbUZJJjReSWVsKHZFJX55PklAUkx1RUxMaHVCPkV3ZUItUVZySllEfmtKQXlXVkRNd1ZWRjU8VmRFTEwxJklANn4jRFJjd2pGaHdjK0Y1O0IqSWEjKylETUwoIURSdHNfRiFlYFdEJD1YTEpZOFJiRVAtMk1Je1BMV0JhQ1hxQ1Vmd2dJPW1KSEY1PEhrQi1RKzFHMzE/NUNVZ1lEQnNiZWJFaz9mQEYjNGs4Qll9WHtKV3Qrb0RxcnxPST1tKUFKemZlakU5ODdnSWN5S01FbSt5TEVKSCtCSUV9SSZGbGJaTEUjZ3E8RkloWDVCOyVvJUp4YnJ2RTg/ZGNEc2srSENyamlPRUpKcDxHMUNEbkZoPDtHRFJ0O2lKV0I2b0k/fFAqRTdMJUlJe1lDVklgXjRZRmh4e1lEUFIwVkl5dms0RXB4YVpEJiZvZEZsa2czRHN0OUxGSSY0XkllKlckRCFgXkRFcCVIekUlPVJeSWdDSUdCc0pGaEc1cnMpQ08yUU9EOFVpJkRSU087RTd1NChDVW8+O0QkPCEjRzNOK0ZDUUFVfUlYN0RTRCozTS1DUUI3ZUN0djR5RzUze2JJRGIyT0QpX2UqSXtQTFdEUDR1ZUpZVmJDSUA2fHpEIWZTWUlheCQySWViaENFa2EwMklYTFg/SWF4WjlDT0cod0pCO0JESVhMRz9DUzdMYEY4Q0h2SkFvYlNKWTBiRURNTF8kSWFnKHhKQXgkLUI7bzU+RzJAS31FN0ROZ0ZJaFhfRHNeWU9EUz19X0I7PDVQQ3RDTHlGNEk2YEp4THomRDd+eE9EITtSIURSU15aRW5MQGFKenU/UUNVbnt9RG9wRElGNEdPS0NSPHtXRCZxdSlJRGIxe0pYPTxIRzFMfjlEb3gjV0p6VUprRkkmNF5JZV5DeUVrP180SlU1OT9GfTt+b0JZfGZISVpuYWJEc2N7S0UjdkBUQ08yUTlFNVF0UkYhZX1hRDg4I0pDUXRMP0Y0WVdnRClfZWhCPT88cklESiUlSXtPNHhJeUx5aUpieUx0RSV9Sn5GNXs8Skl7UExXSWdEVzRKQmBfUkVrYlZUSWNIMzRGbHR6Z0QmPigqRSU8eiVJREokYEQhZHxyRzR7ODJJRG00VEVMdT15RCkpJmBKekRHPkItU1IyRiFfenNFKEhobEcya0tASV8wTWtCc0xtUUQhITA3SlVSRmJGSWhYO0UjI3xQRCZqO0BGIzMyJkZ+U3tERHFafCZEOFUqaEY1e3VxSld0WlZCKjNFZEZod0IqQjs8KSRFbV9kY0NSJFJARiFgQHBHMkB1cEk/fEJfRU9XU29GSSY0XkllcndFQnc5ZilEcVhiTEF4JkV4RE9sKWhFcHpNeURQM2EkQXhqITxGNWQpX0J3OWYpRkkmNF5JZVotKX4+hEUFABffkU1WlBrShEUFV4mVkhEUdkorNUlBrSV4mVkhEUkorNUl2BrSV4mVkhZJRGtEUkorNUhPe0JSQzNwSV5+NStJQENbkpXV",
  })
})

app.get('/mgu2', (req,res) =>{
  res.json({
    sys: "PH5CdzlmKUJ3OWlYRHFaWjFFTzFpfUVKWTxiRUxjYnpFJT1TOERxMkBkRHFJYWNCdzlmKUJ3cUwjRkloWE1EJmFnNkl5IXgpRFJBZipEIWR8WEVuVjYoSldDY1ZDUXROY0QmYWY7RCFtJChKVTNzeklYNm5ESUJIQWpCK21fa0UhMmVoSnhjSUdFOTlONUNyc0omRXA9KiFCWX1BK0RNdW1ZRCpYNnJGSSY0XklmMkl2RCU3dV5EKjJEKklCWTJjRG95OEpEbzx6MEVPcHdiST1fKXtEb3BHRkNSJFJwSlVQeW9JXmpleUVwcUdISmImNDdGOFN4UURzZEswRjRQX19DUXJTbkUmOHZoRjRGeztHNTMqNEl5ITRfSXtQTFdCK21fV0pXY1NqRjhVJT5FN1UzKUJzS3VaSVhUYEtCUkw5QEQkO3Z9Q1FKT0ZCPjBnMkpVUW1hRjhDSDFGNElTI0VMbClqST40UjNFclFPYURxWitUQj0/QmRJYTxkcENVVldFQ1FSJldJQlFlfkZJaFgqRjhMelFFIVBObkRSTFVPRzMyZiFDT0hud0c1WlhzRmg7KmJETU1tOUp6Q2NiST1fKVpDdEJKfUlhPTUlQ1NDTH1JYXhMcEUmN3B+SUR0ZGNCc3V0Z0VuTV94RW1fQUZCPSlsREQmajxURkkmNF5JZWp9bUVyUU1VRFAzK2VGaHhKakY4S155RCZhMGBDcmJPRERQNEglSkFxNiZJYSQ2cEI7eURFRW5vSzRJfGVTYkpiaCtnRHF6WDlKWVQmaEQhY0B3RCpPWWNKYnltU0l7MXkzRjRPPlJJPSFiTkl7UExXRW5WbXlJQDdQY0VKc1VNRSMjNEhJZV5DSUQhbSRoRW5WPFNEcyt2X0QmeS1wSWNxSiFJezI9TkpVUSVXQ3RLYGZEb3g1ekRPX1djSXlNZCZET183JURQNGd4SV5qNUFEUFpJc0JSTHhXRDg5RUlGSWhYdkQkPSh8RjU7X3pDTzJqN0QkfXBZRXBxVXdGOFR6eEU3U2xSSllEY0hJRHQ/e0IpbGQ7QitgNkdJQEIoMElaV1FLSVpuPTlJWExobEUhUEBPRW1tJTBKV0F1fkY0SVYkRU9vSUFEKjNBbkZJJjReSWVsUUVJezI/aUc1UTJFRSN3KjtDcihCWEc1WXdIRjY2cH1FI2YkT0VyUWtGRSU9PlNDUj1AMElEcyh7Qi1Re3dFI3g5JUIpXlRnRWsoO21DVUZzfEY1PFZERTRfNHZJQlFHQkQhXzwwSWVsKDtJe1BMV0lEbD97SnpVUEtJWm5hakl7WUU9RDg4OU1GIW1CQ0NRSXtZSmJ4dSZFSnNoIUNVRDwjRn42T0NJXiYmdUVPb0lZSldMWUlEJHwpLUU1NG5uRDg4Y3ZDUUJKeEQkfWE9SV5qZSRCK3xRfkI7JnUkRkloWEJFaylVIUNycntCRTdDSkpDUzg0cEk9bD19Qj1ASCFJXj8lPUpiPWRORU9HUHdHMilUREc1M3tVRzFFeDBGbHRQWURSUmxpRCR8KW9KWVZES0QqM0FwSV4oeTZHMUx7MUJSQXUhRTg+TGNGSSY0XkllbF8oRn08cypJQkhsVkUlPVN0RjY1QmNJeW1lekpBeVdYRjVgZElFbWxuMkRSZEcoSWVjYXFFcHlmTkZoJDM3RTc2ZWpDUVIhdEpYP0c7Slg/SkRCKWxGK0IrYCsxRHFaVmxKeF9EKkp6dy1rSXtQTFdHMVV1dEpiPHBLSVg3cF5GNTtCKkNSPU0xRn41aU5EUFoxSUVuVmFTQiozRWlJQFJ4ekQhY18/RW53MHhGIzNmbkU1UmwwSldTVFhEcVlGIUljSFM2RWthMGZEUkI2VUZoPDVZSWNqcGtEODlFSUZJaFU3RFBQdldHMU1PUkItWjwyRSV+IXREJnpEOUQhLXd2RTgoanRKenU/UEU3QkBsRG8jcW9FN1JmO0RPK3BGRCZxSStFOVZfbUJhQmNISV56R0BFT1lie0N0Qk18SVg4KTVKWUV2TEQmaXNBRkkmNF5JZXIqS0QlNzFwQ3R0TVVFNGA2LUZ9LXxFSmJ9WnFHM05eJENRY0d0Qj5YOFRKQWgxV0l5TEE/Rn42QCRHMmNzfEQqT0IzRjUjNzFHMUVOckRSU0JmSWV0X2lJZWJXfUZ9fC0hRFBacSZDckA4Kkl7UExXRCFmT29CPlhQM0VtX1ohRzJrdGhKeGM2a0Q4VDFuRHNjMHJFNVJBJkI7JSk2SmJ6MTdFbnZtKUljenAmST40MjJETWUrUUYhIXMqRiEhc0dJWEQpMUpBekItSmImRWFEIWB7P0NyYlJ5RmxjJj9GSWhYR0ItU1I3RjRZNVZFTGNiRURPXmVURW45Zi1EcVlkbURzY3FXRzNOWSNKeCtuckl5dT42RSEzNVZFcCZoUUQlN0klQj4xbk1GaD0ySkl7R3JGRzE4ckBHNXJ2JkljSXY8SVhEKTdFNTU1SkZJJjReSWUqYWdEKUBMWklePWpTQnN1Nl5EOFRRZkRNRFA9RTdLflNGaCE8eEY1IzYmRHFxPW5JXj9iOEU4fkdORSU+aDtJWDdwXkY1LTxeRSFQTmtGIzQ1R0VweEVmRSMjRWlJZjI0LUI7aUNCRzFVTTFJe1BMV0NPSHpiRSV+RHNJPzx0KUleJV5gRzVPPERDT0huQkIreztJRDhVUztEUnR0a0cyKVRVRSU8TFlFOTlkZEl5TSVySmImVFJFblZUcUUjdyt4RSUmcEZKQXpQZUQmaT9jRThAM01EOFUwNklacHQpRkloWDxFbSk+ckNRQX0rRXBwMElFTG1hZUQqWUFHRTk3KV5FN0JzZUpBRlRqRmxrcWRFOTl6I0Nyc1VFSXtZRTxEbz1GLUlYNnpKRUwqYzBHNUhPe0JSQzNwSV5+NStJQENuRUpZRHltSkJgQl9GSSY0XkllbChmRmh3RTNEJmFfI0NRUmU/RG9vQV5CLUFFUUNVbml9RjhDSDFEUnQ7VUJSQkxESWdDZypFbV52QUlhPUsjRWtqVmNJY2lVZEUjIUN+RFJSanJFcCRxJERQUUImSVpWPTlKWTgjUUI9QEh4SXtQTFdDUXJFRklabyhUSURicipCO3lERUlFfVpjST0rcHxHM05qM0YhYCV9Q1FST2VDU1NSR0lhJH4mRCY+dWZJXj9zPEJSQkwlRjRYaGBFI3deP0Rxemo8SmJ+RWdJQjR5O0N0dVJURTdNVGJJXig7MUZJaFhvRTg9aGFCKV9pLUlAQjYlRE9gUH5EODdMcEQ3fXJrQ1VWfHZJRGt5Q0lhZyZtQ1FBfXxFUC0hdElhZlFvSXltPUZFNGA2WUlaVyYkRmh3Y0xJY3JERkczTippRTc3SXpEISNYdEljcnBaRkkmNF5JZWxncUp4ZHo4SXlNRmpET15wfUU3TTAjRE9fRm5JfGQ8OEljYXZfRCltR2JEc2tebUQhXyRpRTVQcndDdEMxZEY4bjRtSlkwLVFJPWxmZUUjOz9aSmJ5JHRJQkd+YEVwPiYxST0tUjVFTHViVUl7UExXRTk5WV9CLVIjVEY0RyM1SWVAfTFEN35paEVMdX1iSWEkOWxGODdjZkRvI2NBSVp3KGVKeF5tREljaXdUSld0WW1JXj9EI0I7PjFVRCFgbl5FNGBWdUVKWUN0RzVRYHNEb2c4YENVb3FJRjV8ej1GSWhYK0RzZFhFRmh2bDxJY3BfSUlgXmp6RjRJMyNCc0tnSkVrYjVkRTc2XlhEUFBffkU1WlBrSV4mVkhEUkorbkpXVDk2RCEtOXJJXmpSKUpYfXQlRCQ9aHFGSSY0XkllcndFQnc5ZilEcVhiTEF4JkV4RE9sKWhFcHpNeURQM2EkQXhqITxGNWQpX0J3OWYpRkkmNF5JZVotKX4+hEUFABffkU1WlBrShEUFV4mVkhEUdkorNUlBrSV4mVkhEUkorNUl2BrSV4mVkhZJRGtEUkorNUhPe0JSQzNwSV5+NStJQENbkpXV",
  })
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

// openssl req -new -sha256 -key ECgenpkey.key -out OK.csr -subj "/C=DE/ST=Bavaria/L=Vehicle/O=BMW AG/OU=Head Unit/CN=X"
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