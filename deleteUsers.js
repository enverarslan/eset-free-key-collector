const {Sleep, deleteUser, writeFileAsync} = require("./utils");

let usersData = require("./users.json");

module.exports = async ()=>{

    if (!usersData || usersData.length === 0){
        console.log("No users found!");
        return;
    }

    for (let user of usersData){
        if (!user.completed){
            continue;
        }
        await deleteUser(user);
        usersData = usersData.filter((u)=> u.username !== user.username);
        await Sleep(3000);
    }

    await writeFileAsync('users.json', JSON.stringify(usersData));
    console.log('users deleted!');

    return Promise.resolve();
};