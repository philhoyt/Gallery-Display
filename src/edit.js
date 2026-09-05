import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText } from '@wordpress/block-editor';
import { Placeholder, Button, Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

import Inspector from './inspector';
import MediaSelector from './MediaSelector';
import { buildPreviewDoc } from './preview-doc';

export default function Edit( { attributes, setAttributes } ) {
	const { images, layout, caption } = attributes;

	const blockProps = useBlockProps( {
		className: 'ph-gallery-display-editor',
	} );

	const [ isPreviewOpen, setIsPreviewOpen ] = useState( false );

	// Set by wp_add_inline_script in gallery-display.php.
	const pluginUrl = window.GalleryDisplayPluginUrl ?? '';

	// Images that arrived through a transform from core/gallery carry no
	// dimensions, because core/image does not store any. The justified and
	// mosaic previews need aspect ratios, so resolve them from the media
	// library here.
	//
	// Read-only on purpose. Writing these back with setAttributes would mark
	// the post dirty simply by opening it, and would churn undo history as the
	// async results land. The front end never needs them either — render.php
	// re-resolves every image from its attachment id.
	const dimensions = useSelect(
		( select ) => {
			const core = select( 'core' );
			if ( ! core || typeof core.getMedia !== 'function' ) {
				return {};
			}

			const resolved = {};
			( images ?? [] ).forEach( ( img ) => {
				if ( img.width && img.height ) {
					return;
				}
				const id = Number( img.id );
				if ( ! id ) {
					return;
				}
				const details = core.getMedia( id )?.media_details;
				if ( details?.width && details?.height ) {
					resolved[ id ] = {
						width: details.width,
						height: details.height,
					};
				}
			} );
			return resolved;
		},
		[ images ]
	);

	const previewDoc =
		images?.length && pluginUrl
			? buildPreviewDoc( attributes, pluginUrl, dimensions )
			: null;

	// --- Empty state ---
	if ( ! images || images.length === 0 ) {
		return (
			<>
				<Inspector
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
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
							buttonLabel={ __(
								'Add Images',
								'gallery-display'
							) }
						/>
					</Placeholder>
				</div>
			</>
		);
	}

	// --- Gallery editor ---
	return (
		<>
			<Inspector
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
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
						{ images.length } { __( 'images', 'gallery-display' ) }
						{ ' · ' }
						{ layout }
					</span>
					<div className="ph-gallery-display-editor__actions">
						<MediaSelector
							images={ images }
							onSelect={ ( selected ) =>
								setAttributes( { images: selected } )
							}
							buttonLabel={ __(
								'Edit Gallery',
								'gallery-display'
							) }
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

				{ /*
				   Gallery-level caption, matching core/gallery. Rich text, so
				   render.php filters it with wp_kses_post() and the preview
				   applies the matching allowlist from sanitize.js.
				*/ }
				<RichText
					identifier="caption"
					tagName="figcaption"
					className="wp-block-ph-gallery-display__caption"
					aria-label={ __( 'Gallery caption', 'gallery-display' ) }
					placeholder={ __(
						'Add a gallery caption…',
						'gallery-display'
					) }
					value={ caption }
					onChange={ ( value ) =>
						setAttributes( { caption: value } )
					}
				/>
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
