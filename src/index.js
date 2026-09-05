// style.css matches the /style\.css$/ splitChunks regex in @wordpress/scripts
// and is extracted to build/style-index.css — loaded on frontend + editor.
import './style.css';

// editor.css is extracted to build/index.css — loaded in the editor only.
import './editor.css';

import { registerBlockType, createBlock } from '@wordpress/blocks';
import { select } from '@wordpress/data';

import metadata from './block.json';
import Edit from './edit';
import { makeTransforms } from './block-transforms';

/**
 * Collect what the editor already knows about each attachment.
 *
 * Transforms are synchronous, so this reads only what the core data store has
 * cached — which, for a gallery the user is looking at, is usually everything.
 * Anything missing is simply absent from the map, and galleryToDisplay()
 * deliberately errs toward preserving the author's text in that case.
 *
 * @param {Array} innerBlocks core/image blocks.
 * @return {Object} Map of attachment id to { alt, caption }.
 */
function readCachedAttachmentMeta( innerBlocks ) {
	const meta = {};
	const core = select( 'core' );

	if ( ! core || 'function' !== typeof core.getMedia ) {
		return meta;
	}

	( innerBlocks ?? [] ).forEach( ( block ) => {
		const id = Number( block?.attributes?.id );
		if ( ! id ) {
			return;
		}
		const media = core.getMedia( id );
		if ( ! media ) {
			return;
		}
		meta[ id ] = {
			alt:
				'string' === typeof media.alt_text ? media.alt_text : undefined,
			caption:
				'string' === typeof media.caption?.raw
					? media.caption.raw
					: undefined,
		};
	} );

	return meta;
}

// save returns null — render.php handles all frontend output.
registerBlockType( metadata.name, {
	edit: Edit,
	save: () => null,

	// Transforms cannot be declared in block.json; they have to be passed here.
	transforms: makeTransforms( {
		createBlock,
		blockName: metadata.name,
		readAttachmentMeta: readCachedAttachmentMeta,
	} ),
} );
