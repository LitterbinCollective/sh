import { Readable } from 'stream';

import { BaseModifier } from './modifiers';

export const UNDERSCORE_DASH_REGEX = /[_-]/g;
export const REPEATED_SPACES_REGEX = /\s+/g;
export const TEMPLATE_REGEX = /{(\d+)}/g;
export const OGG_FILE_EXTENSION_REGEX = /\.ogg$/g;

export const AUDIO_BUFFER_TIMEOUT_MS = 30000;

export const SCOPE_TYPE_SOUND = 'sound';
export const SCOPE_TYPE_GROUP = 'group';
export const SCOPE_TYPE_MODIFIER_EXPRESSION = 'modifier_expression';
export const SCOPE_TYPE_MISC = 'misc';

export const FILTER_NAME_LENGTH = 8;

export const CACHE_SAMPLE_RATE = 48000;
export const CACHE_AUDIO_CHANNELS = 2;

export const MUTE_CHATSOUND = 'sh';

export const SOUNDS_CACHE_DIRECTORY = 'sounds/';
export const SOURCES_CACHE_DIRECTORY = 'sources/';

export interface CachedSource {
  hash: string;
  sounds: Record<string, Chatsound[]>;
}

export interface ContextReturnValueTypes {
  buffer: Buffer;
  stream: Readable;
}

export interface AudioSettings {
  sampleRate: number;
  audioChannels: number;
  format: string;
  codec?: string;
}

export interface Chatsound {
  url: string;
  realm: string;
}

export interface ChatsoundsOptions {
  modifiers?: Record<string, typeof BaseModifier>,
  gitHubToken?: string
}