const os = require("os");
const util = require("util");
const axios = require("axios");
const exec = util.promisify(require('child_process').exec);
const writeFileAsync = util.promisify(require('fs').writeFile);

const mailProvider = require('@cemalgnlts/mailjs');

const MailJS = new mailProvider();

const getRandomAccount = async ()=>{
    let {status, data: account} = await MailJS.createOneAccount();

    if (!status){
        throw new Error("Account creation failed!");
    }
    return account;
}


const getLicense = (message_text)=>{

    /* Replace linebreaks with "|" and replace multi spaces to one space. */
    let message = message_text.replace(/(\r\n|\n|\r)/gm, "|").replace(/\s+/g, " ");

    /* Data patterns */
    const id_pattern = /License\/Public ID:(\|){2}([A-Z\-\d]+)(\|){2}/;
    const product_pattern = /Product:(\|){2}(.+?)(\|){2}/;
    const license_pattern = /License key:(\|){2}([A-Z\-\d]+)(\|){2}/;
    const username_pattern = /Username:(\|){2}([A-Z]{3}-\d+)(\|){2}/;
    const password_pattern = /Password:(\|){2}([a-z\d]+)(\|){2}/;
    const quantity_pattern = /Quantity:(\|){2}(\d+)(\|){2}/;
    const expiration_pattern = /Expiration:(\|){2}(\d+\/\d+\/\d+)(\|){2}/;

    let response;

    try{
        /* Match patterns with message */
        let id_match = message.match(id_pattern)
        let product_match = message.match(product_pattern)
        let license_match = message.match(license_pattern)
        let username_match = message.match(username_pattern)
        let password_match = message.match(password_pattern)
        let quantity_match = message.match(quantity_pattern)
        let expiration_match = message.match(expiration_pattern)

        /* Create Object */
        let license = {
            public_id: id_match[2],
            product: product_match[2],
            license_key: license_match[2],
            username: username_match[2],
            password: password_match[2],
            quantity: quantity_match[2],
            expiration: expiration_match[2],
        }

        response = {
            status: true,
            license: license,
        };
    }catch (err){
        response = {
            status: false,
            license: null,
        }
    }

    return response;
}

const fetchLicenseMessage = async (user)=>{

    await MailJS.login(user.username, user.password);

    let {status: allStatus, data: messages} = await MailJS.getMessages();

    if(!allStatus){
        return false;
    }

    let [license_mail] = messages.filter((message)=>{
        return /license information/.test(message.subject) || /LICENSE INFORMATION/.test(message.intro);
    });

    if (!license_mail){
        return false;
    }

    let {status: singleStatus, data: message} = await MailJS.getMessage(license_mail.id)


    if(!singleStatus){
        return false;
    }

    let {status: licenseStatus, license} = getLicense(message.text);

    if (!licenseStatus){
        return false;
    }

    return license;

}

const deleteUser = async (user)=>{
    await MailJS.login(user.username, user.password);
    const { status, data, message } = await MailJS.deleteMe();
    return Promise.resolve(status);
}


const connectVPN = async () => {

    let provider = {
        exe: 'hsscp.exe',
        shortcut: '.\\Hotspot.lnk',
        interface: 'HotspotShield',
    };

    /* Find PID Hotspot VPN */
    let vpn_pid = await findPidByName(provider.exe);

    if (vpn_pid) { // running
        process.kill(vpn_pid);
    }

    /* Get my ip */
    let {ip: MyIp} = await checkIP();

    /* Start Vpn app */
    await exec(`start ${provider.shortcut}`)
    vpn_pid = await findPidByName(provider.exe);

    /* Wait for app launching */
    console.log("Connecting to VPN...")
    await Sleep(10000);
    await waitConnectionEstablished();


    /* Get VPN Ip */
    let {status, ip} = await checkIP();
    console.log("Checking ips...")
    /* Check IP changed */
    if (!status || MyIp === ip) {
        return {
            status: false,
            pid: vpn_pid,
        };
    }
    console.log("Connected to VPN...")
    console.log(`IP: ${ip}`);
    return {
        status: true,
        pid: vpn_pid,
        ip: ip,
        local_ip: MyIp,
    };
}

const DisconnectVPN = async () => {
    let provider = {
        exe: 'hsscp.exe',
        shortcut: '.\\Hotspot.lnk',
        interface: 'HotspotShield',
    };
    let vpn_pid = await findPidByName(provider.exe);
    if (vpn_pid) { // running
        process.kill(vpn_pid);
        return true;
    }
    return false;
}

const checkIP = async () => {
    let response = await axios.get("http://ip-api.com/json/", {timeout: 5000})
        .catch((err)=> {
            console.log(err.message);
            return {
                status: false,
                ip: null,
            };
        });
    return {
        status: response.status === 200 && response.data && response.data.status === "success" && response.data.countryCode !== "TR",
        ip: response.data.query,
    };
}

const findPidByName = async (name) => {
    let {stdout} = await exec(`tasklist /FI "IMAGENAME eq ${name}"`);
    let lines = stdout.toString().replace(/\r/g, "").split('\n').filter((v) => v !== '');
    let process_data = lines.pop().split(" ").filter((v) => v !== "");
    if (process_data[0] === name) {
        return parseInt(process_data[1]);
    }
    return false;
}

const waitConnectionEstablished = () => {
    return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
            let interfaces = Object.keys(os.networkInterfaces());
            if (interfaces.includes('HotspotShield')) {
                clearInterval(interval);
                resolve(true)
            }
        }, 500)
    })
}

const Sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { connectVPN, DisconnectVPN, Sleep, getRandomAccount, fetchLicenseMessage, deleteUser, writeFileAsync }