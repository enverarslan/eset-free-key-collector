const fs = require("fs");
const faker = require('faker');
const {devices} = require('puppeteer');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
let users = require('./users.json');
const { workstations, states } = require('./data');
const {connectVPN, DisconnectVPN, getRandomAccount, Sleep} = require("./utils");

puppeteer.use(StealthPlugin());


module.exports = async()=>{

    if (!users || users.length === 0){
        users = [];
    }

    let deviceList = Object.keys(devices);

    /* Faker Data */
    let form_fields = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        phone: faker.phone.phoneNumber(),
        company: faker.company.companyName(),
    };

    let state = states[Math.floor(Math.random()*states.length)];
    let workstation = workstations[Math.floor(Math.random()*workstations.length)];
    let account = await getRandomAccount();
    let device = deviceList[Math.floor(Math.random()*deviceList.length)];

    /* Disconnect & Connect VPN */
    await DisconnectVPN();
    let {status} = await connectVPN()
    if(!status){
        await DisconnectVPN();
        process.exit(-1);
    }

    try{
        const browser = await puppeteer.launch({
            userDataDir: `./chromeData/`,
            headless: false,
        });

        const [page] = await browser.pages();

        await page.emulate(devices[device]);

        await page.goto("https://www.eset.com/us/business/trial/");

        await page.waitForNetworkIdle();
        await page.waitForTimeout(1000);

        await page.waitForSelector('input[name="firstName"]')

        await page.type('input[name=emailAddress]', account.username)
        await page.waitForTimeout(300);

        await page.type('input[name=firstName]', form_fields.firstName)
        await page.waitForTimeout(300);

        await page.type('input[name=lastName]', form_fields.lastName)
        await page.waitForTimeout(300);

        await page.type('input[name=phone]', form_fields.phone)
        await page.waitForTimeout(300);

        await page.type('input[name=company]', form_fields.company)
        await page.waitForTimeout(300);

        await page.select('select[name=workstations]', workstation)
        await page.waitForTimeout(300);

        await page.select('select[name=caslSub]', 'No')
        await page.waitForTimeout(300);

        await page.select('select[name=state]', state);
        await page.waitForTimeout(300);

        await page.click('input[type=submit]');

        await page.waitForNetworkIdle({timeout:0});
        //await page.waitForTimeout(5000);


        await browser.close();

        account.completed = false;
        users.push(account);

        fs.writeFile('users.json', JSON.stringify(users), function () {
            console.log("Work done!")
        });

    }catch (error){
        console.log(error);
    }finally {
        await DisconnectVPN();
    }

    return Promise.resolve();
};


