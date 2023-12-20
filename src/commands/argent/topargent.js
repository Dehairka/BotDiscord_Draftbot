const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/user.model');
const logger = require('../../config/logger');
const { embed } = require('../../config/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topargent')
    .setDescription('Afficher le classement des membres en fonction de leur argent.'),

  async execute(interaction) {
    const usersDB = await User.find({}).sort({ diamonds: -1 }).limit(10).exec();
    const users = usersDB.map((user) => {
      return {
        name: user.name,
        value: `${user.diamonds} 💎`,
      };
    });
    await interaction.reply({
      embeds: [embed(interaction, users, 'Classement des membres en fonction de leur argent.')],
    });
    logger.info(`${interaction.member.user.globalName} a utilisé la commande /topargent`);
  },
};
