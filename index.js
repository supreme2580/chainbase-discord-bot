const express = require("express");
const Moralis = require("moralis").default;
const discord = require("discord.js");
require("dotenv").config();
const app = express();
const port = 3000;

const client = new discord.Client({
    intents: [],
  });

client.login(process.env.PASS);

const wallet = "0x24769Cfb25b71A94073613095a901A03B6fB3B49"

const known = [
  {
    user_id: "1158228529746554912",
    address: "0x24769Cfb25b71A94073613095a901A03B6fB3B49"
  },
  {
    user_id: "919141293878280203",
    address: "0xA3Db2Cb625bAe87D12AD769C47791a04BA1e5b29"
  },
  {
    user_id: "766599656863563797",
    address: "0x67A3BEE6d619fCba630b83DCA445F8600e7762dE"
  }
]

app.use(express.json());

app.post("/webhook/", async (req, res) => {
  const { body, headers } = req;

  try {
    Moralis.Streams.verifySignature({
      body,
      signature: headers["x-signature"],
    });

    const fromAddress = body?.txs[0]?.fromAddress;
    const toAddress = body?.txs[0]?.toAddress;

    const fromUserObject = known.find(data => data.address.toLowerCase() === fromAddress);
    const toUserObject = known.find(data => data.address.toLowerCase() === toAddress);

    const fromUser = fromUserObject != undefined ? `<@${fromUserObject.user_id }>`: fromAddress;
    const toUser = toUserObject != undefined ? `<@${toUserObject.user_id }>` : toAddress;

    let amount = Number(body.txs[0]?.value / 1E18) || 0;

    const channel = await client.channels.fetch(process.env.CHANNEL);
    channel.send(`@everyone Spade Treasury ${fromAddress.toLowerCase() === wallet.toLowerCase() ? "sent" : 
    "received"} ${amount} Goerli Eth ${fromAddress.toLowerCase() === wallet.toLowerCase() ? "to" : "from"} ${fromAddress.toLowerCase() === 
      wallet.toLowerCase() ? toUser : fromUser}🎉🎉🎉. You can confirm this transaction on https://goerli.etherscan.io/tx/${body?.txs[0]?.hash}`
    );

    return res.status(200).json();
  } catch (e) {
    return res.status(400).json();
  }
});

app.get("/webhook/", async () => {
  return res.status(200).json();
});

Moralis.start({
  apiKey: process.env.APIKEY,
}).then(() => {
  app.listen(port, () => {
    setInterval(() => {
      console.log(`Listening to streams🎉🎉🎉`);
    }, 3000);
  });
});