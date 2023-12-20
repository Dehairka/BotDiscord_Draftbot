const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/user.model');
const logger = require('../../config/logger');
const { embed } = require('../../config/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('payer')
    .setDescription('Donner de son argent à un membre.')
    .addUserOption((option) => option.setName('membre').setDescription('Membre qui recevra les diamants').setRequired(true))
    .addIntegerOption((option) =>
      option.setName('montant').setDescription('Montant de diamants à définir').setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('membre');
    if (!user) return interaction.reply('Pas de membre à qui donner des diamants');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply('Pas de membre à qui donner des diamants');
    // Get the amount of diamonds to add
    const amount = interaction.options.getInteger('montant');
    // Look if the user is in the database
    const userDB = await User.findOne({ discordId: interaction.member.user.id }).exec();
    if (!userDB) {
      // If the user is not in the database, create it
      const newUser = new User({
        discordId: interaction.member.user.id,
        diamonds: 0,
        name: interaction.member.user.username,
      });
      await newUser.save();
    }
    // Look if the user has enough money
    if (userDB.diamonds < amount) {
      return interaction.reply({ embeds: [embed(interaction, [], "Vous n'avez pas assez de diamants.")] });
    }

    // Look for the user who will receive the diamonds in the database
    let userDB2 = await User.findOne({ discordId: user.id }).exec();
    if (!userDB2) {
      // If the user is not in the database, create it
      const newUser = new User({
        discordId: user.id,
        diamonds: 0,
        name: user.username,
      });
      userDB2 = await newUser.save();
    }

    // Remove the diamonds from the user
    userDB.diamonds -= amount;
    // Add the diamonds to the user
    userDB2.diamonds += amount;

    await userDB.save();
    await userDB2.save();
    // Send a message to the user
    const fields = [{ name: 'Membre qui à reçu les diamants', value: user.username }];

    await interaction.reply({
      embeds: [
        embed(interaction, fields, `${interaction.member.user.globalName} a bien envoyé ${amount} à ${user.username}`),
      ],
    });
    logger.info(`${interaction.member.user.globalName} a donné ${amount} diamants à ${user.username}.`);
  },
};
