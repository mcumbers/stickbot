import { transformLoginData } from '#root/transformers/loginData';
import { LogLevel } from '@sapphire/framework';
import '@sapphire/plugin-hmr/register';
import { GatewayIntentBits, OAuth2Scopes, Partials, type ClientOptions } from 'discord.js';
import * as dotenv from "dotenv";
dotenv.config();

export const DEV = process.env.NODE_ENV !== 'production';
const { OAUTH_ID, OAUTH_SECRET, OAUTH_REDIRECT, API_PORT, BOT_TOKEN } = process.env;

export const CONTROL_GUILD = '250501026958934020';
export const OWNERS: string[] = ['109004714934300672'];
export const VERSION = '0.1.0';

export const INIT_ALL_USERS = false;
export const INIT_ALL_MEMBERS = false;

export const CLIENT_OPTIONS: ClientOptions = {
	shards: 'auto',
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildScheduledEvents,
		GatewayIntentBits.AutoModerationConfiguration,
		GatewayIntentBits.AutoModerationExecution
	],
	loadDefaultErrorListeners: false,
	partials: [Partials.Channel, Partials.GuildMember, Partials.GuildScheduledEvent, Partials.Message, Partials.Reaction, Partials.User],
	presence: {
		activities: [
			{
				name: '',
				type: 3
			}
		]
	},
	logger: {
		level: DEV ? LogLevel.Debug : LogLevel.Info
	},
	api: {
		auth: {
			id: OAUTH_ID as string,
			secret: OAUTH_SECRET as string,
			cookie: 'SB_AUTH',
			domainOverwrite: DEV ? 'localhost' : undefined,
			redirect: DEV ? 'http://localhost:5173/oauth/register' : OAUTH_REDIRECT as string,
			scopes: [OAuth2Scopes.Identify, OAuth2Scopes.Guilds, OAuth2Scopes.GuildsMembersRead],
			transformers: [transformLoginData]
		},
		prefix: '/',
		origin: '*',
		listenOptions: {
			port: parseInt(API_PORT as string, 10)
		}
	},
	hmr: {
		enabled: DEV
	}
};

export const TOKENS = {
	BOT_TOKEN
};
