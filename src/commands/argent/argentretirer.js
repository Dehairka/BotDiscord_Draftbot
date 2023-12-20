const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const User = require('../../models/user.model');
const logger = require('../../config/logger');
const { embed } = require('../../config/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('argentretirer')
    .setDescription('Retirer des diamants à un membre')
    .addUserOption((option) => option.setName('membre').setDescription('Membre qui perdra les diamants').setRequired(true))
    .addIntegerOption((option) =>
      option.setName('montant').setDescription('Montant de diamants à retirer').setRequired(true)
    )
    .addStringOption((option) => option.setName('raison').setDescription('Raison de la soustraction').setRequired(false)),

  async execute(interaction) {
    // Search if the user has the permission to use this command
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply("Tu n'as pas la permission d'ajouter des diamants !");
    }
    // Get the user to add diamonds to
    const user = interaction.options.getUser('membre');
    if (!user) return interaction.reply('Pas de membre à qui donner des diamants');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply('Pas de membre à qui donner des diamants');
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
    // Get the reason for the donation
    const reason = interaction.options.getString('raison');
    // Get the amount of diamonds to add
    const amount = interaction.options.getInteger('montant');
    // Add the diamonds to the user
    userDB.diamonds -= amount;
    if (userDB.diamonds < 0) {
      userDB.diamonds = 0;
    }
    await userDB.save();
    // Send a message to the user
    const fields = [
      { name: 'Membre qui perdra les diamants', value: user.username },
      { name: 'Montant de la soustraction', value: `${amount} 💎`, inline: true },
    ];
    if (reason) {
      fields.push({ name: 'Raison', value: reason, inline: true });
    }

    await interaction.reply({ embeds: [embed(interaction, fields, 'Vous avez bien retiré des diamants à un membre')] });
    logger.info(
      `${interaction.member.user.globalName} a retiré ${amount} diamants à ${user.username} | Raison : ${reason} | Il en a maintenant ${userDB.diamonds}`
    );
    // await interaction.reply(
    //   `Tu as ajouté ${amount} diamants à ${user.username} | Raison : ${reason} | Il en a maintenant ${userDB.diamonds}`
    // );
  },
};
