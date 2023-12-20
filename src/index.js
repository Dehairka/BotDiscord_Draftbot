/* eslint-disable no-restricted-syntax */
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
// const loadEvents = require("./loaders/loadEvents");

// On se connecte à la base de données MongoDB
let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
});

// On gère les erreurs de connexion à la base de données MongoDB
const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});

// Discord bot //
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    // eslint-disable-next-line security/detect-non-literal-require, import/no-dynamic-require, global-require
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      const commandName = file.split('.')[0];
      client.commands.set(commandName, command);
      commands.push(command.data.toJSON());
    } else {
      logger.info(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.discord.token);

// and deploy your commands!
(async () => {
  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(Routes.applicationGuildCommands(config.discord.id, config.discord.guild), {
      body: commands,
    });

    logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    logger.error(error);
  }
})();

client.once(Events.ClientReady, (readyClient) => {
  logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(error);
    await interaction.reply({
      content: "Une erreur est survenue lors de l'exécution de cette commande !",
      ephemeral: true,
    });
  }
});

client.login(config.discord.token);
