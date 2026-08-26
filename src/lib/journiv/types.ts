/** Journiv API ???? OpenAPI ???????? */

export interface QuillDelta {
  ops: Array<{ insert?: string | Record<string, unknown>; attributes?: Record<string, unknown> }>;
}

export interface JournivUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: JournivUser;
}

export interface JournivJournal {
  id: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface JournivMood {
  id: string;
  name: string;
  score?: number;
  icon?: string;
  color_value?: number;
}

export interface JournivEntryPreview {
  id: string;
  title?: string;
  content_delta?: QuillDelta;
  content_plain_text?: string;
  word_count?: number;
  journal_id?: string;
}

export interface JournivMediaThumbnail {
  id: string;
  mime_type?: string;
  thumbnail_url?: string;
}

export interface JournivMoment {
  id: string;
  logged_date_tz: string;
  logged_at_utc: string;
  logged_timezone: string;
  note?: string;
  location_json?: { name?: string; address?: string; [key: string]: unknown };
  primary_mood_id?: string;
  entry?: JournivEntryPreview;
  mood_activity?: Array<{ mood?: JournivMood }>;
  media?: JournivMediaThumbnail[];
  media_count?: number;
  tags?: Array<{ id: string; name: string; color?: string }>;
}

export interface MomentPageResponse {
  items: JournivMoment[];
  next_cursor_logged_at_utc?: string;
  next_cursor_id?: string;
}

export interface CreateMomentPayload {
  logged_date_tz: string;
  logged_timezone?: string;
  note?: string;
  primary_mood_id?: string;
  location_json?: { name?: string };
  entry?: {
    title?: string;
    journal_id: string;
    content_delta?: QuillDelta;
  };
}

export interface UpdateMomentPayload {
  note?: string;
  primary_mood_id?: string;
  location_json?: { name?: string };
  entry_update?: {
    title?: string;
    content_delta?: QuillDelta;
  };
}
