let args = process.argv.slice(2);

const licenseFetcher = require('./licenseFetcher.js');
const licenseSaver = require('./licenseSaver.js');
const licenseImporter = require('./licenseImporter.js');
const deleteUsers = require('./deleteUsers.js');
const licenses = require('./licenses.json');



const commandLicenseFetch = async (size) => {
    for (let i = 0; i < size; i++){
        console.log(`Job #${i+1} starting...`);
        await licenseFetcher();
    }
}


(async ()=>{

    switch (args[0]){
        case '-l':
            if (args.length === 1){
                console.log("Please specify license count!");
                process.exit(-1);
            }

            let size = parseInt(args[1]);

            if (size < 1){
                console.log("Please specify license count!");
                process.exit(-1);
            }

            await commandLicenseFetch(size);
            break;
        case '-s':
            await licenseSaver();
            break;
        case '-i':
            await licenseImporter();
            break;
        case '-d':
            await deleteUsers();
            break;
        default:
            console.log(`License Count: ${licenses.length}`);
            break;

    }
    process.exit(0);
})()