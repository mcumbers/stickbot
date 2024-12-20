import { GuildLogEmbed } from '#lib/extensions/GuildLogEmbed';
import { CustomEvents } from '#utils/CustomTypes';
import { getAuditLogEntry, getChannelDescriptor } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, type ListenerOptions } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { AuditLogEvent, BaseGuildTextChannel, GuildChannel, type GuildAuditLogsEntry } from 'discord.js';

@ApplyOptions<ListenerOptions>({ event: Events.ChannelDelete })
export class UserEvent extends Listener {
	public async run(channel: GuildChannel) {
		if (isNullish(channel.id)) return;

		const guildSettingsInfoLogs = await this.container.prisma.guildSettingsInfoLogs.fetch(channel.guild.id);;
		if (!guildSettingsInfoLogs?.channelDeleteLog || !guildSettingsInfoLogs.infoLogChannel) return;

		const logChannel = channel.guild.channels.resolve(guildSettingsInfoLogs.infoLogChannel) as BaseGuildTextChannel;
		const auditLogEntry = await getAuditLogEntry(AuditLogEvent.ChannelDelete, channel.guild, channel);

		return this.container.client.emit(CustomEvents.GuildLogCreate, logChannel, this.generateGuildLog(channel, auditLogEntry));
	}

	private generateGuildLog(channel: GuildChannel, auditLogEntry: GuildAuditLogsEntry | null) {
		const channelDescriptor = getChannelDescriptor(channel.type);

		const embed = new GuildLogEmbed()
			.setTitle(`${channelDescriptor} Deleted`)
			.setDescription(channel.name)
			.setThumbnail(channel.guild.iconURL())
			.setFooter({ text: `Channel ID: ${channel.id}` })
			.setType(Events.ChannelDelete);

		if (channel.parent) embed.addBlankFields({ name: 'In Category', value: channel.parent.name, inline: true });

		if (channel.createdTimestamp) embed.addBlankFields({ name: 'Created', value: `<t:${Math.round(channel.createdTimestamp as number / 1000)}:R>`, inline: true });

		if (auditLogEntry) {
			if (!isNullish(auditLogEntry.reason)) embed.addBlankFields({ name: 'Reason', value: auditLogEntry.reason, inline: false });
			if (!isNullish(auditLogEntry.executor)) embed.addBlankFields({ name: 'Deleted By', value: auditLogEntry.executor.toString(), inline: false });
		}

		return [embed]
	}
}
