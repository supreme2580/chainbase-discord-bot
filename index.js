require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const { Resend } = require("resend");

const sdk = require('api')('@chainbase/v1.0#108opgclm7n3lbc');

const { MongoClient, ServerApiVersion } = require("mongodb");
const mongodb_url = `mongodb+srv://${encodeURIComponent(
  process.env.MONGO_DB_USERNAME
)}:${encodeURIComponent(
  process.env.MONGO_DB_PASSWORD
)}@cluster0.eu7f6iy.mongodb.net/?retryWrites=true&w=majority`;

// const user_wallet = "0xA3Db2Cb625bAe87D12AD769C47791a04BA1e5b29";
// const user_id = "919141293878280203";
const network_id = 8453;

const PORT = process.env.PORT || 3000;

const resend = new Resend(process.env.RESEND_API_KEY);

const discord_client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

const mongodb_client = new MongoClient(mongodb_url);
const collection = mongodb_client.db("chainbase_bot_users").collection("users");

const isEthereumAddress = (address) => {
  return /^(0x)?[0-9a-fA-F]{40}$/.test(address);
};

const isEmailAddress = (email) => {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
};

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
  // const user = await discord_client.users.fetch(user_id);
  const { body } = req;
  const from = body.data.from_address;
  const to = body.data.to_address;
  const value = (body.data.value / 1e18).toFixed(8);

  const from_query = { wallet_address: from };
  const to_query = { wallet_address: to };

  const from_result = await collection.find(from_query).toArray();
  const to_result = await collection.find(to_query).toArray();

  console.log("fr: ", from, "to: ", to);
  console.log("fr-result: ", from_result);
  console.log("to-result: ", to_result);

  if (from_result.length > 0) {
    for (const result of from_result) {
      const discord_id = result.discord_id;
      const user = await discord_client.users.fetch(discord_id);
      const message = `Hey chief, you just sent ${value} Eth to ${to} on Base`;
      console.log(`from: ${from}, to: ${to}, user: ${user}`);
      user.send(message);
      return res.status(200).json();
    }
  }

  if (to_result.length > 0) {
    for (const result of to_result) {
      const discord_id = result.discord_id;
      const user = await discord_client.users.fetch(discord_id);
      const message = `Hey chief, you just received ${value} Eth to ${to} on Base`;
      console.log(`from: ${from}, to: ${to}, user: ${user}`);
      user.send(message);
      return res.status(200).json();
    }
  }

  return res.status(200).json();

  //   if ((from || to) === user_wallet.toLowerCase()) {
  //     try {
  //       const message = `Hey chief, you just ${
  //         from !== user_wallet.toLowerCase()
  //           ? `received ${value} Eth on Base from ${from}`
  //           : `sent ${value} Eth to ${to} on Base`
  //       }`;
  //       resend.emails.send({
  //         from: "victoromorogbe69@gmail.com",
  //         to: [email],
  //         subject: "Registration for chainbase-bot successful!!!",
  //         html: `<p>${message}</p>`
  //       })
  //       user.send(message);
  //       return res.status(200).json();
  //     } catch (error) {
  //       console.log(error);
  //       return res.status(400).json();
  //     }
  //   } else {
  //     console.log("Transaction irrelevant to this user");
  //   }
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

  discord_client.on("guildCreate" || "guildMemberAdd", async (guild) => {
    guild.members.cache.map(
      async (member) =>
        await member.send(
          "Hey chief! Please register by running ```/register``` after the chat"
        )
    );
  });

  discord_client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) {
      console.log("Invalid command");
    }
    const { commandName } = interaction;
    const wallet_address_query = { discord_id: interaction.user.id };
    const wallet_address_result = await collection
      .find(wallet_address_query)
      .toArray();

    if (commandName === "register") {
      const name = interaction.options.getString("name");
      const email = interaction.options.getString("email_address");
      const wallet_address = interaction.options
        .getString("wallet_address")
        .toLowerCase();
      const id = interaction.user.id;

      await mongodb_client.connect();

      if (isEmailAddress(email) && isEthereumAddress(wallet_address)) {
        try {
          const insertManyResult = await collection.insertOne({
            name: name,
            email: email,
            wallet_address: wallet_address,
            discord_id: id,
          });
          if (insertManyResult.insertedId) {
            resend.emails.send({
              from: "victoromorogbe69@gmail.com",
              to: [email],
              subject: "Registration for chainbase-bot successful!!!",
              html: "<p>Hey Chief, you have successfully registered for chainbase-bot, enjoy🎉🎉🎉</p>",
            });

            const created_sender = await sdk.createWebhook({
              webhook_name: `${id}_sender_webhook`,
              webhook_url: 'https://chainbase-bot.onrender.com/webhook',
              data_source: 'base_transactions',
              filters: [
                {
                  values: [wallet_address],
                  field: 'From Address'
                }
              ]
            }, {
              'x-api-key': process.env.CHAINBASE_API_KEY
            })

            const created_receiver = await sdk.createWebhook({
              webhook_name: `${id}_receiver_webhook`,
              webhook_url: 'https://chainbase-bot.onrender.com/webhook',
              data_source: 'base_transactions',
              filters: [
                {
                  values: [wallet_address],
                  field: 'To Address'
                }
              ]
            }, {
              'x-api-key': process.env.CHAINBASE_API_KEY
            })

            if (created_sender.status == "activated" && created_receiver.status == "activated") {
              await interaction.reply("You have been successfully registered!!");
            }

          }
        } catch (err) {
          console.error(
            `Something went wrong trying to insert the new documents: ${err}\n`
          );
        }
      } else {
        if (isEmailAddress(email) === false) {
          await interaction.reply("Invalid email address");
        } else {
          await interaction.reply("Invalid ethereum wallet address");
        }
      }
    }

    if (commandName === "balance") {
      const {
        data: { data },
      } = await axios.get(
        `https://api.chainbase.online/v1/account/balance?chain_id=${network_id}&address=${wallet_address_result.at(
          wallet_address_result.length - 1
        )}`,
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
