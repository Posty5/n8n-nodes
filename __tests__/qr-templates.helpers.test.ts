import type { ILoadOptionsFunctions } from 'n8n-workflow';
import {
	getQrTemplates,
	mergeQrTemplateOptions,
	requireTemplateId,
} from '../utils/qr-templates.helpers';

/** A loadOptions context whose two lookups answer `userItems` and `publicItems`. */
function createLoadOptionsContext(userItems: any[], publicItems: any[]): ILoadOptionsFunctions {
	return {
		getCredentials: jest.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
		helpers: {
			httpRequest: jest.fn().mockImplementation(async (options: any) => {
				if (options.url.endsWith('/api/qr-code-template/user-lookup')) {
					return { result: { items: userItems, pagination: { hasMore: false } } };
				}
				if (options.url.endsWith('/api/qr-code-template/public-lookup')) {
					return { result: { items: publicItems, pagination: { hasMore: false } } };
				}
				throw new Error(`Unexpected request to ${options.url}`);
			}),
		},
	} as unknown as ILoadOptionsFunctions;
}

describe('qr-templates.helpers', () => {
	describe('getQrTemplates (loadOptions)', () => {
		it("should list the caller's templates first, then the public ones, each once", async () => {
			const context = createLoadOptionsContext(
				[
					{ _id: 'tpl-mine', name: 'Brand blue' },
					{ _id: 'tpl-shared', name: 'My public one' },
				],
				[
					{ _id: 'tpl-shared', name: 'My public one' },
					{ _id: 'tpl-public', name: 'Classic' },
				],
			);

			const options = await getQrTemplates.call(context);

			expect(options).toEqual([
				{ name: 'Brand blue', value: 'tpl-mine', description: 'My template' },
				{ name: 'My public one', value: 'tpl-shared', description: 'My template' },
				{ name: 'Classic', value: 'tpl-public', description: 'Public template' },
			]);
		});

		it('should call both lookups with the API key and one large page', async () => {
			const context = createLoadOptionsContext([], []);

			await getQrTemplates.call(context);

			const calls = (context.helpers.httpRequest as jest.Mock).mock.calls.map(
				([options]) => options,
			);
			expect(calls).toHaveLength(2);
			for (const options of calls) {
				expect(options).toEqual(
					expect.objectContaining({
						method: 'GET',
						headers: expect.objectContaining({ 'X-API-Key': 'test-api-key' }),
						qs: { pageSize: 100 },
					}),
				);
			}
			expect(context.getCredentials).toHaveBeenCalledWith('posty5Api');
		});

		it('should reject when a lookup fails, so n8n shows the error in the dropdown', async () => {
			const context = createLoadOptionsContext([], []);
			(context.helpers.httpRequest as jest.Mock).mockRejectedValue({
				response: { body: { message: 'You Need To Sign In First' } },
			});

			await expect(getQrTemplates.call(context)).rejects.toThrow('You Need To Sign In First');
		});
	});

	describe('mergeQrTemplateOptions', () => {
		it('should fall back to the id when a template has no name and skip rows without an id', () => {
			expect(mergeQrTemplateOptions([{ _id: 'tpl-1' }, { _id: '' } as any], [])).toEqual([
				{ name: 'tpl-1', value: 'tpl-1', description: 'My template' },
			]);
		});
	});

	describe('requireTemplateId', () => {
		it('should prefer the Template field, then the legacy collection value, then the stored one', () => {
			expect(
				requireTemplateId('tpl-field', { templateId: 'tpl-legacy' }, { templateId: 'tpl-stored' }),
			).toBe('tpl-field');
			expect(
				requireTemplateId('', { templateId: 'tpl-legacy' }, { templateId: 'tpl-stored' }),
			).toBe('tpl-legacy');
			expect(requireTemplateId('  ', {}, { templateId: 'tpl-stored' })).toBe('tpl-stored');
		});

		it('should throw when there is no template at all', () => {
			expect(() => requireTemplateId('', {})).toThrow('Template is required');
		});
	});
});
