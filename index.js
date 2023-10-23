require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { Client, GatewayIntentBits } = require("discord.js");
const sdk = require("api")("@chainbase/v1.0#4csv10ulmyppvzx");

const user_wallet = "0xA3Db2Cb625bAe87D12AD769C47791a04BA1e5b29";
const user_id = "919141293878280203";

const PORT = process.env.PORT || 3000;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

client.login(process.env.PASS);

const app = express();

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  const user = await client.users.fetch(user_id);
  const { body } = req;
  const from = body.data.from_address;
  const to = body.data.to_address;
  const value = Number(body.data.value / 1e18) || 0;

  if ((from || to) === user_wallet.toLowerCase()) {
    try {
      const message = `Hey chief, you just ${
        from !== user_wallet.toLowerCase()
          ? `received ${value} Eth on Base from ${from}`
          : `sent ${value} Eth to ${to} on Base`
      }`;
      user.send(message);
      return res.status(200).json();
    } catch (error) {
      console.log(error);
      return res.status(400).json();
    }
  } else {
    console.log("Transaction irrelevant to this user");
  }
});

app.get("/webhook", (req, res) => {
  console.log("I'm alive🎉🎉🎉");
  return res.status(200).json();
});

app.listen(PORT, () => {
  console.log(`Webhook receiver listening🎉🎉🎉`);
});

client.once("ready", () => {
  const commands = [
    {
      name: "balance",
      description: `Replies with the balance of ${user_wallet}`,
    },
  ];

  client.application.commands.set(commands).then(() => { console.log("Slash commands registered.") }).catch(console.error);

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) {
      console.log("Invalid command");
    }
    const { commandName } = interaction;

    if (commandName === "balance") {
      const { result } = await sdk.get_address_balance_getAddressBalance_get({ address: user_wallet })
      .catch((err) => console.error(err));
      await interaction.reply(result);
    }
  });
});
