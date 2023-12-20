const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { embed } = require('../../config/embed');
const logger = require('../../config/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Dé-bannir un membre du serveur')
    .addUserOption((option) => option.setName('membre').setDescription('Membre à dé-bannir').setRequired(true))
    .addStringOption((option) => option.setName('raison').setDescription('Raison du déban').setRequired(false)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply("Tu n'as pas la permission de dé-bannir des membres !");
    }
    // Get the user to unban
    const user = interaction.options.getUser('membre');
    if (!user) return interaction.reply('Pas de membre à dé-bannir');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply('Pas de membre à dé-bannir');

    // Get the reason for the unban
    let reason = interaction.options.getString('raison');
    if (!reason) reason = 'Pas de raison fournie.';
    // Check if the user is trying to unban themselves
    if (interaction.user.id === user.id) return interaction.reply('Essaie pas de te faire dé-ban !');
    // Check if the user is trying to unban the owner of the server
    if ((await interaction.guild.fetchOwner()).id === user.id)
      return interaction.reply('Ne dé-ban pas le propriétaire du serveur !');
    // Check if the bot can unban the user
    if (member && !member.bannable) return interaction.reply('Je ne peux pas dé-ban ce membre !');
    // Check if the user can unban the member
    if (member && interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
      return interaction.reply('Tu ne peux pas dé-ban cette personne car vous avez le même rôle !');
    }
    // Try to send a DM to the user
    try {
      await user.send(
        `Tu as été dé-ban du serveur \`${interaction.guild.name}\` par \`${interaction.user.tag}\` pour la raison : \`${reason}\``
      );
    } catch (err) { }

    // Send a reply to the interaction
    await interaction.reply(
      embed(interaction, [], `${interaction.user} a dé-ban \`${user.tag}\` pour la raison : \`${reason}\``)
    );

    // Unban the user
    await member.unban({ reason });
    logger.info(`${interaction.member.user.globalName} a dé-ban ${user.tag} | Raison : ${reason}`);
  },
};
