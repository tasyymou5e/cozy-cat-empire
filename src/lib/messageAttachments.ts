/**
 * Helpers for player-message attachments stored in the private
 * `message-attachments` bucket. Paths are `<playerId|broadcast>/<uuid>-<name>`.
 */
import { supabase } from '@/integrations/supabase/client';

export const MESSAGE_ATTACHMENT_BUCKET = 'message-attachments';
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export interface UploadedAttachment {
  path: string;
  name: string;
  type: string;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
}

/** Uploads a file into the folder for a player (or `broadcast`). */
export async function uploadMessageAttachment(
  file: File,
  folder: string,
): Promise<UploadedAttachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error('Attachment is larger than 10 MB.');
  }
  const path = `${folder}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from(MESSAGE_ATTACHMENT_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;
  return { path, name: file.name.slice(0, 300), type: file.type || 'application/octet-stream' };
}

/** Signed URL (1 hour) for viewing or downloading an attachment. */
export async function signedAttachmentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(MESSAGE_ATTACHMENT_BUCKET)
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export function isImageAttachment(type: string | null | undefined): boolean {
  return !!type && type.startsWith('image/');
}
