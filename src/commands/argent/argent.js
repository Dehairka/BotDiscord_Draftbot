const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/user.model');
const logger = require('../../config/logger');
const { embed } = require('../../config/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('argent')
    .setDescription("Afficher votre argent ou celui d'un utilisateur.")
    .addUserOption((option) => option.setName('membre').setDescription('Membre dont vous voulez voir les diamants')),

  async execute(interaction) {
    const user = interaction.options.getUser('membre') || interaction.member.user;
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
    await interaction.reply({
      embeds: [
        embed(interaction, [{ name: 'Diamants', value: `${userDB.diamonds} 💎` }], `Portefeuille de ${user.username}`),
      ],
    });
    logger.info(`${interaction.member.user.globalName} a utilisé la commande /argent`);
  },
};
