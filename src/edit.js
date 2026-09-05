import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, Button, Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';

import Inspector from './inspector';
import MediaSelector from './MediaSelector';
import { buildPreviewDoc } from './preview-doc';

export default function Edit( { attributes, setAttributes } ) {
	const { images, layout } = attributes;

	const blockProps = useBlockProps( {
		className: 'ph-gallery-display-editor',
	} );

	const [ isPreviewOpen, setIsPreviewOpen ] = useState( false );

	// Set by wp_add_inline_script in gallery-display.php.
	// eslint-disable-next-line no-undef
	const pluginUrl = window.GalleryDisplayPluginUrl ?? '';

	const previewDoc = images?.length && pluginUrl
		? buildPreviewDoc( attributes, pluginUrl )
		: null;

	// --- Empty state ---
	if ( ! images || images.length === 0 ) {
		return (
			<>
				<Inspector attributes={ attributes } setAttributes={ setAttributes } />
				<div { ...blockProps }>
					<Placeholder
						icon="format-gallery"
						label={ __( 'Gallery Display', 'gallery-display' ) }
						instructions={ __(
							'Select images from the media library to build your gallery.',
							'gallery-display'
						) }
					>
						<MediaSelector
							images={ images }
							onSelect={ ( selected ) =>
								setAttributes( { images: selected } )
							}
							buttonLabel={ __( 'Add Images', 'gallery-display' ) }
						/>
					</Placeholder>
				</div>
			</>
		);
	}

	// --- Gallery editor ---
	return (
		<>
			<Inspector attributes={ attributes } setAttributes={ setAttributes } />
			<div { ...blockProps }>
				<div className="ph-gallery-display-editor__thumbs">
					{ images.map( ( img ) => (
						<div
							key={ img.id }
							className="ph-gallery-display-editor__thumb"
						>
							<img src={ img.url } alt={ img.alt || '' } />
						</div>
					) ) }
				</div>
				<div className="ph-gallery-display-editor__footer">
					<span className="ph-gallery-display-editor__meta">
						{ images.length }{ ' ' }
						{ __( 'images', 'gallery-display' ) }
						{ ' · ' }
						{ layout }
					</span>
					<div className="ph-gallery-display-editor__actions">
						<MediaSelector
							images={ images }
							onSelect={ ( selected ) =>
								setAttributes( { images: selected } )
							}
							buttonLabel={ __( 'Edit Gallery', 'gallery-display' ) }
						/>
						<Button
							variant="secondary"
							size="compact"
							onClick={ () => setIsPreviewOpen( true ) }
						>
							{ __( 'Preview', 'gallery-display' ) }
						</Button>
					</div>
				</div>
			</div>

			{ isPreviewOpen && previewDoc && (
				<Modal
					title={ __( 'Gallery Preview', 'gallery-display' ) }
					onRequestClose={ () => setIsPreviewOpen( false ) }
					size="fill"
					className="ph-gallery-display-preview-modal"
				>
					{ /*
					   allow-scripts without allow-same-origin gives the
					   preview an opaque origin, so nothing inside it can
					   reach wp-admin even if a crafted attribute slips
					   past the sanitizers. The layout libraries and
					   PhotoSwipe only need script execution.
					*/ }
					<iframe
						srcDoc={ previewDoc }
						sandbox="allow-scripts"
						title={ __( 'Gallery Preview', 'gallery-display' ) }
						className="ph-gallery-display-preview-modal__iframe"
					/>
				</Modal>
			) }
		</>
	);
}
