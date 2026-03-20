// style.css matches the /style\.css$/ splitChunks regex in @wordpress/scripts
// and is extracted to build/style-index.css — loaded on frontend + editor.
import './style.css';

// editor.css is extracted to build/index.css — loaded in the editor only.
import './editor.css';

import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import Edit from './edit';

// save returns null — render.php handles all frontend output.
registerBlockType( metadata.name, {
	edit: Edit,
	save: () => null,
} );
