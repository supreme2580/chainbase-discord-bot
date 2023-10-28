require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const { MongoClient, ServerApiVersion } = require("mongodb");
const mongodb_url = `mongodb+srv://${encodeURIComponent(
  process.env.MONGO_DB_USERNAME
)}:${encodeURIComponent(
  process.env.MONGO_DB_PASSWORD
)}@cluster0.eu7f6iy.mongodb.net/?retryWrites=true&w=majority`;

const user_wallet = "0xA3Db2Cb625bAe87D12AD769C47791a04BA1e5b29";
const user_id = "919141293878280203";
const network_id = 8453;

const PORT = process.env.PORT || 3000;

const discord_client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

const mongodb_client = new MongoClient(mongodb_url)

const isEthereumAddress = (address) => {
  return (/^(0x)?[0-9a-fA-F]{40}$/).test(address)
}

const isEmailAddress = (email) => {
  return (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i).test(email);
}

const getChainFromNetworkId = (network) => {
  switch (network) {
    case 1:
      return "Ethereum";
    case 137:
      return "Polygon";
    case 56:
      return "BSC";
    case 43114:
      return "Avalanche";
    case 42161:
      return "Arbitrum One";
    case 10:
      return "Optimism";
    case 8453:
      return "Base";
    case 324:
      return "zkSync";
    default:
      break;
  }
};

discord_client.login(process.env.PASS);

const app = express();

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  const user = await discord_client.users.fetch(user_id);
  const { body } = req;
  const from = body.data.from_address;
  const to = body.data.to_address;
  const value = (body.data.value / 1e18).toFixed(8);

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

discord_client.once("ready", () => {
  const commands = [
    {
      name: "balance",
      description: "Replies with the balance of user's wallet",
    },
    {
      name: "register",
      description: "register a new user",
      options: [
        {
          name: "name",
          description: "Your name",
          type: 3,
          required: true,
        },
        {
          name: "email_address",
          description: "Your email address",
          type: 3,
          required: true,
        },
        {
          name: "wallet_address",
          description: "Your wallet address",
          type: 3,
          required: true,
        },
      ],
    },
  ];

  discord_client.application.commands
    .set(commands)
    .then(() => {
      console.log("Slash commands registered.");
    })
    .catch(console.error);

    discord_client.on('guildCreate' || 'guildMemberAdd', async (guild) => {
      guild.members.cache.map(async member => await member.send("Hey chief! Please register by running ```/register``` after the chat"))
    });

  discord_client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) {
      console.log("Invalid command");
    }
    const { commandName } = interaction;

    if (commandName === "register") {
      const name = interaction.options.getString("name");
      const email = interaction.options.getString("email_address");
      const wallet_address = interaction.options.getString("wallet_address");
      const id = interaction.user.id;

      await mongodb_client.connect()

      const collection = mongodb_client.db("chainbase_bot_users").collection("users");

      if (isEmailAddress(email) && isEthereumAddress(wallet_address)) {
        try {
          const insertManyResult = await collection.insertOne({
            name: name,
            email: email,
            wallet_address: wallet_address,
            discord_id: id,
          });
          if (insertManyResult.insertedId) {
            await interaction.reply("You have been successfully registered!!")
          }
        } catch (err) {
          console.error(`Something went wrong trying to insert the new documents: ${err}\n`);
        }
      }
      else {
        if (isEmailAddress(email) === false) {
          await interaction.reply("Invalid email address")
        }
        else {
          await interaction.reply("Invalid ethereum wallet address")
        }
      }
    }

    if (commandName === "balance") {
      const {
        data: { data },
      } = await axios.get(
        `https://api.chainbase.online/v1/account/balance?chain_id=${network_id}&address=${user_wallet}`,
        {
          headers: {
            "x-api-key": process.env.CHAINBASE_API_KEY,
            accept: "application/json",
          },
        }
      );
      await interaction.reply(
        `${parseInt(data, 16) / 1e18} ETH on ${getChainFromNetworkId(
          network_id
        )}`
      );
    }
  });
});
