import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	RangeControl,
	ToggleControl,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { applyFilters } from '@wordpress/hooks';

import MediaSelector from './MediaSelector';

const DEFAULT_LAYOUTS = [
	{ value: 'grid', label: __( 'Grid', 'gallery-display' ) },
	{ value: 'masonry', label: __( 'Masonry', 'gallery-display' ) },
	{ value: 'mosaic', label: __( 'Mosaic', 'gallery-display' ) },
	{ value: 'justified', label: __( 'Justified', 'gallery-display' ) },
	{ value: 'list', label: __( 'List', 'gallery-display' ) },
];

const ASPECT_RATIOS = [
	{ value: '1/1', label: __( '1:1 — Square', 'gallery-display' ) },
	{ value: '4/3', label: __( '4:3', 'gallery-display' ) },
	{ value: '3/2', label: __( '3:2', 'gallery-display' ) },
	{ value: '16/9', label: __( '16:9', 'gallery-display' ) },
	{ value: '3/4', label: __( '3:4 — Portrait', 'gallery-display' ) },
	{ value: '9/16', label: __( '9:16 — Tall Portrait', 'gallery-display' ) },
];

const ORDER_OPTIONS = [
	{ value: 'default', label: __( 'Default (manual)', 'gallery-display' ) },
	{
		value: 'date-asc',
		label: __( 'Date (oldest first)', 'gallery-display' ),
	},
	{
		value: 'date-desc',
		label: __( 'Date (newest first)', 'gallery-display' ),
	},
	{ value: 'title-asc', label: __( 'Title (A–Z)', 'gallery-display' ) },
	{ value: 'title-desc', label: __( 'Title (Z–A)', 'gallery-display' ) },
	{ value: 'rand', label: __( 'Random', 'gallery-display' ) },
];

const ORDER_OPTIONS_MOSAIC = [
	...ORDER_OPTIONS,
	{ value: 'auto', label: __( 'Auto (best fit)', 'gallery-display' ) },
];

// Shown when the image-sizes request fails — which is exactly when a
// translated fallback matters, so these are localized like every other label.
const FALLBACK_SIZES = [
	{ value: 'thumbnail', label: __( 'Thumbnail', 'gallery-display' ) },
	{ value: 'medium', label: __( 'Medium', 'gallery-display' ) },
	{ value: 'large', label: __( 'Large', 'gallery-display' ) },
	{ value: 'full', label: __( 'Full Size', 'gallery-display' ) },
];

export default function Inspector( { attributes, setAttributes } ) {
	const {
		images,
		layout,
		linkTo,
		thumbnailSize,
		fullSize,
		showCaption,
		captionPosition,
		columns,
		aspectRatio,
		rowHeight,
		orderBy,
	} = attributes;

	const [ imageSizes, setImageSizes ] = useState( FALLBACK_SIZES );

	// Fetch registered image sizes from our REST endpoint once on mount.
	useEffect( () => {
		apiFetch( { path: '/gallery-display/v1/image-sizes' } )
			.then( ( sizes ) => {
				if ( Array.isArray( sizes ) && sizes.length ) {
					setImageSizes(
						sizes.map( ( { slug, label } ) => ( {
							value: slug,
							label,
						} ) )
					);
				}
			} )
			.catch( () => {
				// Keep FALLBACK_SIZES if the request fails.
			} );
	}, [] );

	return (
		<InspectorControls>
			{ /* ----------------------------------------------------------------
			     Layout Panel
			     ---------------------------------------------------------------- */ }
			<PanelBody
				title={ __( 'Layout', 'gallery-display' ) }
				initialOpen={ true }
			>
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'Layout', 'gallery-display' ) }
					value={ layout }
					options={ applyFilters(
						'galleryDisplay.layouts',
						DEFAULT_LAYOUTS
					) }
					onChange={ ( v ) => setAttributes( { layout: v } ) }
				/>

				{ [ 'grid', 'masonry', 'mosaic' ].includes( layout ) && (
					<RangeControl
						__nextHasNoMarginBottom
						label={ __( 'Columns', 'gallery-display' ) }
						value={ columns }
						onChange={ ( v ) => setAttributes( { columns: v } ) }
						min={ 1 }
						max={ 6 }
					/>
				) }

				{ layout === 'grid' && (
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Aspect Ratio', 'gallery-display' ) }
						value={ aspectRatio }
						options={ ASPECT_RATIOS }
						onChange={ ( v ) =>
							setAttributes( { aspectRatio: v } )
						}
					/>
				) }

				{ layout === 'justified' && (
					<RangeControl
						__nextHasNoMarginBottom
						label={ __( 'Row Height (px)', 'gallery-display' ) }
						value={ rowHeight }
						onChange={ ( v ) => setAttributes( { rowHeight: v } ) }
						min={ 80 }
						max={ 500 }
					/>
				) }

				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'Order', 'gallery-display' ) }
					value={ orderBy }
					options={
						layout === 'mosaic'
							? ORDER_OPTIONS_MOSAIC
							: ORDER_OPTIONS
					}
					onChange={ ( v ) => setAttributes( { orderBy: v } ) }
				/>
			</PanelBody>

			{ /* ----------------------------------------------------------------
			     Image Settings Panel
			     ---------------------------------------------------------------- */ }
			<PanelBody
				title={ __( 'Image Settings', 'gallery-display' ) }
				initialOpen={ false }
			>
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'Thumbnail Size', 'gallery-display' ) }
					value={ thumbnailSize }
					options={ imageSizes }
					onChange={ ( v ) => setAttributes( { thumbnailSize: v } ) }
				/>

				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Show Caption', 'gallery-display' ) }
					checked={ showCaption }
					onChange={ ( v ) => setAttributes( { showCaption: v } ) }
				/>

				{ showCaption && (
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Caption Position', 'gallery-display' ) }
						value={ captionPosition }
						options={ [
							{
								value: 'below',
								label: __( 'Below Image', 'gallery-display' ),
							},
							{
								value: 'overlay',
								label: __( 'Overlay', 'gallery-display' ),
							},
						] }
						onChange={ ( v ) =>
							setAttributes( { captionPosition: v } )
						}
					/>
				) }

				<MediaSelector
					images={ images }
					onSelect={ ( selected ) =>
						setAttributes( { images: selected } )
					}
					buttonLabel={
						images && images.length > 0
							? __( 'Edit Gallery', 'gallery-display' )
							: __( 'Add Images', 'gallery-display' )
					}
				/>
			</PanelBody>

			{ /* ----------------------------------------------------------------
			     Lightbox & Links Panel
			     ---------------------------------------------------------------- */ }
			<PanelBody
				title={ __( 'Lightbox & Links', 'gallery-display' ) }
				initialOpen={ false }
			>
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'On Click', 'gallery-display' ) }
					value={ linkTo }
					options={ [
						{
							value: 'lightbox',
							label: __( 'Open Lightbox', 'gallery-display' ),
						},
						{
							value: 'attachment',
							label: __( 'Attachment Page', 'gallery-display' ),
						},
						{
							value: 'media',
							label: __( 'Media File', 'gallery-display' ),
						},
						{
							value: 'none',
							label: __( 'Nothing', 'gallery-display' ),
						},
					] }
					onChange={ ( v ) => setAttributes( { linkTo: v } ) }
				/>

				{ linkTo === 'lightbox' && (
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Full-Size Image', 'gallery-display' ) }
						value={ fullSize }
						options={ imageSizes }
						onChange={ ( v ) => setAttributes( { fullSize: v } ) }
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);
}
