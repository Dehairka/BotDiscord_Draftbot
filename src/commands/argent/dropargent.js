const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const User = require('../../models/user.model');
const logger = require('../../config/logger');
const { embed } = require('../../config/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dropargent')
    .setDescription("Créer un message qui offre de l'argent au premier qui clique sur le bouton.")
    .addIntegerOption((option) =>
      option.setName('montant').setDescription('Montant de diamants à offrir.').setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply("Tu n'as pas la permission de définir des diamants !");
    }
    // Get the amount of diamonds to add
    const amount = interaction.options.getInteger('montant');
    // Send a message to the user

    const response = await interaction.reply({
      embeds: [embed(interaction, [], `Gagnez ${amount} 💎 en cliquant sur le bouton ci-dessous !`)],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              label: 'Récupérer',
              custom_id: 'argent',
              disabled: false,
              emoji: {
                name: '💎',
                id: null,
              },
            },
          ],
        },
      ],
    });
    logger.info(`${interaction.member.user.globalName} a utilisé la commande /dropargent`);

    try {
      const confirmation = await response.awaitMessageComponent({ time: 30_000 });

      if (confirmation.customId === 'argent') {
        if (!confirmation.member) return await confirmation.update({ embeds: [embed(interaction, [], `Pas de membre à qui donner des diamants`)], components: [] });
        const winner = confirmation.guild.members.cache.get(confirmation.user.id);
        // Look for the user in the database
        let winnerDB = await User.findOne({ discordId: winner.id }).exec();
        if (!winnerDB) {
          // If the user is not in the database, create it
          const newUser = new User({
            discordId: winner.id,
            diamonds: 0,
            name: winner.username,
          });
          winnerDB = await newUser.save();
        }
        // Add the diamonds to the user
        winnerDB.diamonds += amount;
        await winnerDB.save();
        await confirmation.update({ embeds: [embed(interaction, [], `${confirmation.member} à reçu ${amount} de diamants`)], components: [] });
      }
    } catch (e) {
      await interaction.editReply({ embeds: [embed(interaction, [], `Personne n'a réclamé les diamants !`)], components: [] });
    }
  },
};
