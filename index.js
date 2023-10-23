require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits } = require("discord.js");

const user_wallet = "0xA3Db2Cb625bAe87D12AD769C47791a04BA1e5b29"
const user_id = "919141293878280203"

const PORT = process.env.PORT || 3000;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.login(process.env.PASS);

const app = express();

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {

    const user = client.users.cache.get(user_id);
    const { body } = req
    const from = body.data.from_address
    const to = body.data.to_address
    const value = Number(body.data.value / 1E18) || 0;

    client.once("ready", () => {

        if (user) {
            const message = `Hey chief, you just ${from !== user_wallet ? `received ${value} Eth on Base from ${from}` : `sent ${value} Eth to ${to} on Base`}`;
            user.send(message).then(() => console.log(`Message sent to ${user}`)).catch(e => console.log(e))
            return res.status(200).json();
        }
        else {
            console.log("User not found")
            return res.status(400).json();
        }
    })
});

app.get('/webhook', (res, req) => {
    console.log("I'm alive🎉🎉🎉")
    return res.status(200).json();
})

app.listen(PORT, () => {
    console.log(`Webhook receiver listening🎉🎉🎉`);
});
