/**
 * Turning what the node's UI collected into the `comments[]` the API takes.
 *
 * Extracted because the video flow and the image flow both do it, and two copies
 * of "map the UI onto the payload" is where one of them keeps sending the
 * deprecated singular after the other stops.
 */

/** One comment, as the API declares it. Nothing else may be sent. */
export interface IPostCommentPayload {
  text: string;
  delayMinutes?: number;
  imageUrl?: string;
  postToFacebook: boolean;
  postToInstagram: boolean;
  postToYoutube: boolean;
  /** Always false: TikTok exposes no public comment-posting endpoint. */
  postToTiktok: false;
}

/** At most this many. Enforced server-side; mirrored here so the node can stop first. */
export const MAX_POST_COMMENTS = 5;

/** One entry of the `comments` fixedCollection, as n8n hands it back. */
interface IRawComment {
  text?: unknown;
  delayMinutes?: unknown;
  imageUrl?: unknown;
  postToFacebook?: unknown;
  postToInstagram?: unknown;
  postToYoutube?: unknown;
}

function hasText(row: IRawComment | undefined): row is IRawComment & { text: string } {
  return typeof row?.text === 'string' && row.text.trim().length > 0;
}

function toPayload(row: IRawComment & { text: string }): IPostCommentPayload {
  const payload: IPostCommentPayload = {
    text: row.text,
    postToFacebook: row.postToFacebook !== false,
    postToInstagram: row.postToInstagram !== false,
    postToYoutube: row.postToYoutube !== false,
    postToTiktok: false,
  };

  // Only sent when they carry something. Joi refuses an undeclared key and
  // validates the ones it declares, so an empty string in `imageUrl` is a 400
  // about a URL the user never typed.
  const delay = Number(row.delayMinutes);
  if (Number.isFinite(delay) && delay > 0) payload.delayMinutes = delay;
  if (typeof row.imageUrl === 'string' && row.imageUrl.trim()) payload.imageUrl = row.imageUrl.trim();

  return payload;
}

/**
 * The comments to send, from the two collections the node offers.
 *
 * `comments` wins. The deprecated singular is mapped into the list ONLY when the
 * list is empty — the API refuses a request carrying both, so a workflow that
 * has been upgraded halfway must not send two shapes. A blank row is dropped
 * rather than sent: a row somebody added and never typed into is an abandoned
 * intention, not a comment, and the API would charge for it.
 */
export function buildCommentsPayload(
  comments: { comment?: IRawComment[] } | undefined,
  legacyComment: IRawComment | undefined,
): IPostCommentPayload[] {
  const rows = Array.isArray(comments?.comment) ? comments!.comment! : [];
  const filled = rows.filter(hasText).map(toPayload);

  if (filled.length) return filled.slice(0, MAX_POST_COMMENTS);
  if (hasText(legacyComment)) return [toPayload(legacyComment)];
  return [];
}
