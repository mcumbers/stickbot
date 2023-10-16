import { authenticated } from '#root/lib/util/decorators/routeAuthenticated';
import { ApplyOptions } from '@sapphire/decorators';
import { HttpCodes, Route, methods, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { ChannelType, PermissionsBitField } from 'discord.js';

@ApplyOptions<Route.Options>({
	name: 'guildChannels',
	route: 'guilds/:guildID/channels'
})

export class UserRoute extends Route {
	public constructor(context: Route.Context, options: Route.Options) {
		super(context, {
			...options
		});
	}

	@authenticated()
	public async [methods.GET](request: ApiRequest, response: ApiResponse) {
		const requestAuth = request.auth!
		const { client } = this.container;

		// Fetch the Guild this request is for
		const guild = await client.guilds.fetch(request.params.guildID);
		if (!guild) return response.error(HttpCodes.NotFound);

		// Fetch the GuildMember who sent the request
		const member = await guild.members.fetch(requestAuth.id);
		const canManageServer: boolean = guild.ownerId === member.id || member.permissions.has(PermissionsBitField.Flags.ManageGuild) || member.permissions.has(PermissionsBitField.Flags.Administrator);
		if (!canManageServer) return response.error(HttpCodes.Forbidden);

		// Start our Channels collection
		// Filter out DMs and Threads for the sake of our own API
		let channels = (await guild.channels.fetch()).filter((channel) => {
			if (!channel) return false;
			switch (channel.type as ChannelType) {
				case ChannelType.DM:
				case ChannelType.GroupDM:
				case ChannelType.AnnouncementThread:
				case ChannelType.PublicThread:
				case ChannelType.PrivateThread: return false
				default: return true;
			}
		});

		// Get query Params
		const queryParams = request.query;
		// If channel type specified, filter by it
		if (!isNullishOrEmpty(queryParams.type)) {
			const paramType: number = parseInt(queryParams.type as string, 10);
			channels = channels.filter((channel) => channel && channel.type === paramType);
		}
		// If channel name specified, filter by it
		if (!isNullishOrEmpty(queryParams.name)) {
			const paramName: string = queryParams.name as string;
			channels = channels.filter((channel) => channel && channel.name === paramName);
		}
		// If no channels are left after filtering, Error 404
		if (!channels.size) return response.error(HttpCodes.NotFound);

		// Return collection of channels
		return response.json({ data: { channels } });
	}

}
