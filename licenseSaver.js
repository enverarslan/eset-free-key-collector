const fs = require("fs");
const {Sleep, fetchLicenseMessage, writeFileAsync} = require("./utils");

const licenses = require('./licenses.json');
const usersData = require('./users.json');

module.exports = async ()=>{

    if (usersData.length === 0){
        console.log("No users found!");
        return;
    }

    for (let [index, user] of usersData.entries()){
        if(user.completed){
            continue;
        }
        let license = await fetchLicenseMessage(user);
        if (license){
            await Sleep(3000);
            licenses.push(license);
            user.completed = true;
        }else{
            user.completed = false;
            await Sleep(2000);
        }
        usersData[index] = user;
    }

    await writeFileAsync('users.json', JSON.stringify(usersData));
    console.log('users saved!');
    await writeFileAsync('licenses.json', JSON.stringify(licenses));
    console.log('licenses saved!');

    return Promise.resolve();
};