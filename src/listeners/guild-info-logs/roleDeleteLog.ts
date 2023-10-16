import { GuildLogEmbed } from '#lib/extensions/GuildLogEmbed';
import { getAuditLogEntry } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, type ListenerOptions } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { AuditLogEvent, BaseGuildTextChannel, Role, type GuildAuditLogsEntry } from 'discord.js';

@ApplyOptions<ListenerOptions>({ event: Events.GuildRoleDelete })
export class UserEvent extends Listener {
	public async run(role: Role) {
		if (isNullish(role.id)) return;

		const guildSettingsInfoLogs = await this.container.prisma.guildSettingsInfoLogs.findUnique({ where: { id: role.guild.id } });
		if (!guildSettingsInfoLogs?.roleDeleteLog || !guildSettingsInfoLogs.infoLogChannel) return;

		const logChannel = role.guild.channels.resolve(guildSettingsInfoLogs.infoLogChannel) as BaseGuildTextChannel;
		const auditLogEntry = await getAuditLogEntry(AuditLogEvent.RoleDelete, role.guild, role);

		return this.container.client.emit('guildLogCreate', logChannel, await this.generateGuildLog(role, auditLogEntry));
	}

	private async generateGuildLog(role: Role, auditLogEntry: GuildAuditLogsEntry | null) {
		const embed = new GuildLogEmbed()
			.setTitle('Role Deleted')
			.setDescription(`${role.name}`)
			.setThumbnail(role.icon ? role.iconURL() ?? role.guild.iconURL() : role.guild.iconURL())
			.setFooter({ text: `Role ID: ${role.id}` })
			.setType(Events.GuildRoleDelete);

		if (role.createdTimestamp) embed.addFields({ name: 'Created', value: `<t:${Math.round(role.createdTimestamp as number / 1000)}:R>`, inline: true });

		if (role.tags) {
			if (role.tags.botId) embed.addFields({ name: 'Bot Role For', value: `<@${role.tags.botId}> (Bot)`, inline: true });

			if (role.tags.integrationId) {
				const integrations = await role.guild.fetchIntegrations();
				const integration = integrations.find((ign) => ign.id === role.tags?.integrationId);
				if (integration) embed.addFields({ name: 'Integration Role For', value: integration?.name as string, inline: true });
			}

			if (role.tags.premiumSubscriberRole) embed.addFields({ name: 'Role Type', value: 'Premium Subscriber Role', inline: true });
			if (role.tags.guildConnections) embed.addFields({ name: 'Role Type', value: 'Server Linked Role', inline: true });
			if (role.tags.availableForPurchase) embed.addFields({ name: 'Role Type', value: 'Purchasable Role', inline: true });
		}

		if (auditLogEntry) {
			if (!isNullish(auditLogEntry.reason)) embed.addFields({ name: 'Reason', value: auditLogEntry.reason, inline: false });
			if (!isNullish(auditLogEntry.executor)) embed.addFields({ name: 'Deleted By', value: auditLogEntry.executor.toString(), inline: false });
		}

		return [embed]
	}
}
