const axios= require('axios');
const licenseData = require('./licenses.json');
const puppeteer = require("puppeteer-extra");
const crypto = require( 'crypto' );
const TelegramBot = require("node-telegram-bot-api");

const token = '<redacted-telegram-bot-api-key>';

module.exports = async ()=>{

    let licenses = [];
    for (let license of licenseData){
        let hash = crypto.createHash('sha1').update(license.public_id).digest('hex')

        let base_url = `<redacted-licence-remote-save-endpoint-host>/license/${hash}`;
        let {data:url} = await axios.get(`http://ouo.io/api/<redacted-ouoio-api-key>?s=${base_url}`);
        license['hash_code'] = hash;
        license['url'] = url;
        licenses.push(license);
    }

    const browser = await puppeteer.launch({
        headless: true,
    });

    const [page] = await browser.pages();

    page.setDefaultNavigationTimeout(0)

    await page.goto("<redacted-licence-remote-save-endpoint-host>");

    await page.waitForNetworkIdle();

    let cookies = await page.cookies();
    let cookie = cookies.find((c)=>c.name === '__test');	


    let licensesText = JSON.stringify(licenses);
    let encoded = Buffer.from(licensesText).toString('base64');

    let response = await axios.post(`<redacted-licence-remote-save-endpoint-host>/savelicenses.php`,{
       licenses: encoded,
   }, {
       headers: {
           "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
           "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
           "Cookie": `${cookie.name}=${cookie.value}`
       }
   });

   if (response && response.data){
       if (response.data.success && response.data.count > 0){

           const bot = new TelegramBot(token, {polling: true});

           let chat_message = `New Keys: ${(new Date()).toLocaleDateString().replace(/\./g, '/')}\n\n`;

           for (let license of licenses){
               chat_message+= license.url + "\n"
           }

           await bot.sendMessage("@<redacted-telegram-channel>", chat_message);

           console.log(`${response.data.count} Licenses saved`);
       }else{
           console.log('Licenses not saved!')
       }
   }

   process.exit();
}