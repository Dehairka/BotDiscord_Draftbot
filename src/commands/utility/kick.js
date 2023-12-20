const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { embed } = require('../../config/embed');
const logger = require('../../config/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick un membre du serveur')
    .addUserOption((option) => option.setName('membre').setDescription('Membre à kick').setRequired(true))
    .addStringOption((option) => option.setName('raison').setDescription('Raison du kick').setRequired(false)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return interaction.reply("Tu n'as pas la permission de kick des membres !");
    }
    // Get the user to kick
    const user = interaction.options.getUser('membre');
    if (!user) return interaction.reply('Pas de membre à kick');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply('Pas de membre à kick');

    // Get the reason for the kick
    let reason = interaction.options.getString('raison');
    if (!reason) reason = 'Pas de raison fournie.';
    // Check if the user is trying to kick themselves
    if (interaction.user.id === user.id) return interaction.reply('Essaie pas de te faire kick !');
    // Check if the user is trying to kick the owner of the server
    if ((await interaction.guild.fetchOwner()).id === user.id)
      return interaction.reply('Ne kick pas le propriétaire du serveur !');
    // Check if the bot can kick the user
    if (member && !member.kickable) return interaction.reply('Je ne peux pas kick ce membre !');
    // Check if the user can kick the member
    if (member && interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
      return interaction.reply('Tu ne peux pas kick cette personne car vous avez le même rôle !');
    }
    // Try to send a DM to the user
    try {
      await user.send(
        `Tu as été kick du serveur \`${interaction.guild.name}\` par \`${interaction.user.tag}\` pour la raison : \`${reason}\``
      );
    } catch (err) { }

    // Send a reply to the interaction
    await interaction.reply({
      embeds: [embed(interaction, [], `${interaction.user} a kick \`${user.tag}\` pour la raison : \`${reason}\``)],
    });
    // await interaction.reply(`${interaction.user} a kick \`${user.tag}\` pour la raison : \`${reason}\``);

    // Kick the user
    await member.kick(reason);
    logger.info(`${interaction.member.user.globalName} a kick ${user.username} | Raison : ${reason}`);
  },
};
