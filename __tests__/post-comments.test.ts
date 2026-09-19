import { MAX_POST_COMMENTS, buildCommentsPayload } from '../utils/post-comments';

/**
 * What the node sends as `comments[]`.
 *
 * The interesting rule is the one about NOT sending both shapes: the API refuses
 * a request carrying `comment` and `comments` together, and a workflow half
 * upgraded — the user filled in the new collection but never cleared the old
 * one — is exactly the state that would produce one.
 */
describe('buildCommentsPayload', () => {
  it('maps the list the user filled in', () => {
    const payload = buildCommentsPayload(
      {
        comment: [
          { text: 'First' },
          { text: 'Second', delayMinutes: 60 },
        ],
      },
      undefined,
    );

    expect(payload).toEqual([
      {
        text: 'First',
        postToFacebook: true,
        postToInstagram: true,
        postToYoutube: true,
        postToTiktok: false,
      },
      {
        text: 'Second',
        delayMinutes: 60,
        postToFacebook: true,
        postToInstagram: true,
        postToYoutube: true,
        postToTiktok: false,
      },
    ]);
  });

  it('keeps the order the user put them in — that is the order they post', () => {
    const payload = buildCommentsPayload(
      { comment: [{ text: 'a' }, { text: 'b' }, { text: 'c' }] },
      undefined,
    );

    expect(payload.map((row) => row.text)).toEqual(['a', 'b', 'c']);
  });

  // A row somebody added and never typed into is an abandoned intention, not a
  // comment — and the API would charge 25 credits for it.
  it('drops a blank row rather than sending it', () => {
    const payload = buildCommentsPayload(
      { comment: [{ text: 'real' }, { text: '   ' }, {}] },
      undefined,
    );

    expect(payload).toHaveLength(1);
    expect(payload[0].text).toBe('real');
  });

  it('stops at the maximum', () => {
    const rows = Array.from({ length: 9 }, (_, i) => ({ text: `c${i}` }));

    const payload = buildCommentsPayload({ comment: rows }, undefined);

    expect(payload).toHaveLength(MAX_POST_COMMENTS);
  });

  describe('the deprecated singular', () => {
    it('is used when the list is empty, so an old workflow keeps working', () => {
      const payload = buildCommentsPayload({}, { text: 'The old way.' });

      expect(payload).toEqual([
        {
          text: 'The old way.',
          postToFacebook: true,
          postToInstagram: true,
          postToYoutube: true,
          postToTiktok: false,
        },
      ]);
    });

    // The whole reason this is one function: sending both is a 400, and a
    // half-upgraded workflow is exactly how that happens.
    it('is ignored when the list has anything in it', () => {
      const payload = buildCommentsPayload(
        { comment: [{ text: 'The new way.' }] },
        { text: 'The old way.' },
      );

      expect(payload).toHaveLength(1);
      expect(payload[0].text).toBe('The new way.');
    });

    it('is ignored when it is blank', () => {
      expect(buildCommentsPayload({}, { text: '  ' })).toEqual([]);
      expect(buildCommentsPayload(undefined, undefined)).toEqual([]);
    });
  });

  describe('the optional fields', () => {
    // Joi validates the keys it declares, so an empty `imageUrl` is a 400 about
    // a URL the user never typed.
    it('omits a delay of zero and an empty image', () => {
      const [payload] = buildCommentsPayload(
        { comment: [{ text: 'a', delayMinutes: 0, imageUrl: '' }] },
        undefined,
      );

      expect(payload).not.toHaveProperty('delayMinutes');
      expect(payload).not.toHaveProperty('imageUrl');
    });

    it('trims an image URL and keeps a real delay', () => {
      const [payload] = buildCommentsPayload(
        { comment: [{ text: 'a', delayMinutes: 30, imageUrl: '  https://cdn.test/a.jpg  ' }] },
        undefined,
      );

      expect(payload.delayMinutes).toBe(30);
      expect(payload.imageUrl).toBe('https://cdn.test/a.jpg');
    });

    it('ignores a delay that is not a number', () => {
      const [payload] = buildCommentsPayload(
        { comment: [{ text: 'a', delayMinutes: 'soon' }] },
        undefined,
      );

      expect(payload).not.toHaveProperty('delayMinutes');
    });

    it('honours a platform the user switched off', () => {
      const [payload] = buildCommentsPayload(
        { comment: [{ text: 'a', postToInstagram: false, postToYoutube: false }] },
        undefined,
      );

      expect(payload.postToFacebook).toBe(true);
      expect(payload.postToInstagram).toBe(false);
      expect(payload.postToYoutube).toBe(false);
    });
  });

  // TikTok exposes no public comment-posting endpoint. The node never offers
  // the toggle and never sends it as anything but false.
  it('never aims a comment at TikTok', () => {
    const payload = buildCommentsPayload(
      { comment: [{ text: 'a' }, { text: 'b' }] },
      undefined,
    );

    expect(payload.every((row) => row.postToTiktok === false)).toBe(true);
  });
});
