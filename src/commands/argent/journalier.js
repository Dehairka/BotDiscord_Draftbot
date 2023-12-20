const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/user.model');
const logger = require('../../config/logger');
const { embed } = require('../../config/embed');

module.exports = {
  data: new SlashCommandBuilder().setName('journalier').setDescription("Récupérer sa somme d'argent quotidienne"),

  async execute(interaction) {
    // Get the user who used the command
    const { user } = interaction.member;
    // Look for the user in the database
    let userDB = await User.findOne({ discordId: user.id }).exec();
    if (!userDB) {
      // If the user is not in the database, create it
      const newUser = new User({
        discordId: user.id,
        diamonds: 0,
        name: user.username,
      });
      userDB = await newUser.save();
    }
    // If the user already got his daily money
    if (userDB.daily > Date.now()) {
      return interaction.reply({ embeds: [embed(interaction, [], 'Vous avez déjà récupéré votre argent quotidien.')] });
    }
    // Add the daily money to the user
    userDB.diamonds += 1000;
    // Set the daily to Date.now + 24h
    userDB.daily = Date.now() + 86400000;
    await userDB.save();

    await interaction.reply({
      embeds: [embed(interaction, [], 'Vous avez bien reçu 1.000 diamants 💎 dans votre portefeuille')],
    });
    logger.info(`${interaction.member.user.globalName} a utilisé la commande /journalier`);
  },
};
