import { BotCommand } from '#lib/extensions/BotCommand';
import { BotEmbed } from '#lib/extensions/BotEmbed';
import type { CommandRunEvent } from '#root/listeners/control-guild-logs/commandRun';
import { CustomEvents } from '#utils/CustomTypes';
import { ApplyOptions } from '@sapphire/decorators';
import { type ChatInputCommand } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';

@ApplyOptions<ChatInputCommand.Options>({
	description: 'Retrieve information about a role',
	preconditions: ['IsModerator']
})

export class UserCommand extends BotCommand {
	public override registerApplicationCommands(registry: ChatInputCommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
				.setDMPermission(false)
				.addRoleOption((option) =>
					option
						.setName('role')
						.setDescription('The role to fetch information for')
						.setRequired(true)
				)
				.addBooleanOption((option) =>
					option
						.setName('private')
						.setDescription('Whether or not the message should be shown only to you (default false)')
				));
	}

	public async chatInputRun(interaction: ChatInputCommand.Interaction) {
		const startTime = Date.now();
		// Check to see if response should be ephemeral
		const ephemeral = interaction.options.getBoolean('private') ?? false;
		let message = await interaction.deferReply({ ephemeral, fetchReply: true });

		// Fetch targetRole from Discord
		const targetRole = interaction.guild?.roles.resolve(interaction.options.getRole('role')?.id as string);
		if (!targetRole) {
			message = await interaction.followUp({ content: `Unable to fetch information for ${targetRole}, please try again later.` });
			return this.container.client.emit(CustomEvents.BotCommandRun, { interaction, message, runtime: Date.now() - startTime } as CommandRunEvent);
		}

		// Find targetRole's position in Guild Roles
		const rolesSorted = interaction.guild?.roles.cache.sort((roleA, roleB) => roleB.position - roleA.position);

		// Create Response Embed
		const embed = new BotEmbed()
			.setTitle('Role Information')
			.setDescription(`${targetRole.unicodeEmoji ?? ''}${targetRole.toString()}`)
			.setThumbnail(targetRole.iconURL() ?? interaction.guild?.iconURL() ?? null)
			.setFooter({ text: `Role ID: ${targetRole.id}` })
			.addFields(
				{ name: 'Members', value: `${targetRole.members.size}`, inline: true },
				{ name: 'Hierarchy', value: `${rolesSorted!.map(r => r.position).indexOf(targetRole?.position as number) + 1}`, inline: true }
			);

		if (targetRole.hexColor !== '#000000') {
			embed.setColor(targetRole.color);
			embed.addFields({ name: 'Color', value: targetRole.hexColor, inline: true });
		}

		embed.addFields({ name: 'Created', value: `<t:${Math.round(targetRole.createdTimestamp as number / 1000)}:R>` });

		// Gather Info for Response Embed
		const roleInfo = [];
		if (targetRole.mentionable) roleInfo.push('- Mentionable');
		if (targetRole.hoist) roleInfo.push('- Displayed Separately');

		if (targetRole.tags) {
			if (targetRole.tags.premiumSubscriberRole) roleInfo.push('- Received when Boosting Server');
			if (targetRole.tags.botId) {
				const botMember = await targetRole.guild.members.fetch(targetRole.tags.botId).catch(() => undefined);
				if (botMember && botMember.user.displayAvatarURL()) {
					embed.setThumbnail(botMember.user.displayAvatarURL());
				}
				roleInfo.push(`- Managed by <@${targetRole.tags.botId}>`);
			}

			if (targetRole.tags.integrationId) {
				const integrations = await targetRole.guild.fetchIntegrations();
				const integration = integrations.get(targetRole.tags.integrationId);
				if (integration) {
					roleInfo.push(`- Managed by ${integration.type === 'discord' ? integration.name : integration.type} (Integration)`);
				}
			}
		}

		// Add additional info to Response Embed
		if (roleInfo.length) embed.addFields({ name: 'Details', value: roleInfo.join('\n') });

		// Send Response Embed
		message = await interaction.followUp({ content: '', embeds: [embed] });
		return this.container.client.emit(CustomEvents.BotCommandRun, { interaction, message, runtime: Date.now() - startTime } as CommandRunEvent);
	}
}
