/**
 * The block transforms configuration.
 *
 * Kept out of index.js and built by a factory so it can be unit tested without
 * the wp.blocks and wp.data packages, which are runtime externals and are
 * therefore not installed as dependencies. Injecting createBlock and the
 * attachment lookup means the wiring — isMatch, the argument order of the
 * transform callbacks, what gets passed to createBlock — is covered by tests
 * rather than only by the mappers underneath it.
 */

import {
	CORE_GALLERY,
	CORE_IMAGE,
	galleryToDisplay,
	displayToGallery,
	hasUsableImages,
} from './transforms';

/**
 * Build the transforms object passed to registerBlockType.
 *
 * @param {Object}   deps                    Injected dependencies.
 * @param {Function} deps.createBlock        createBlock from @wordpress/blocks.
 * @param {string}   deps.blockName          This block's name.
 * @param {Function} deps.readAttachmentMeta Returns { id: { alt, caption } }.
 * @return {Object} A block transforms configuration.
 */
export function makeTransforms( {
	createBlock,
	blockName,
	readAttachmentMeta = () => ( {} ),
} ) {
	return {
		from: [
			{
				type: 'block',
				blocks: [ CORE_GALLERY ],
				// isMatch( attributes, block ) — confirmed against the block
				// transforms reference. Uses the same predicate as the mapper,
				// so the transform is never offered for a gallery that would
				// convert to an empty block.
				isMatch: ( attributes, block ) =>
					hasUsableImages( block?.innerBlocks ),
				transform: ( attributes, innerBlocks ) =>
					createBlock(
						blockName,
						galleryToDisplay(
							attributes,
							innerBlocks,
							readAttachmentMeta( innerBlocks )
						)
					),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ CORE_GALLERY ],
				transform: ( attributes ) => {
					const { galleryAttributes, imageBlockAttributes } =
						displayToGallery( attributes );

					return createBlock(
						CORE_GALLERY,
						galleryAttributes,
						imageBlockAttributes.map( ( imageAttributes ) =>
							createBlock( CORE_IMAGE, imageAttributes )
						)
					);
				},
			},
		],
	};
}
