/**
 * Isotope library bundle.
 *
 * Assigns Isotope to window.IsotopeLib so both init-masonry.js and
 * init-mosaic.js share a single copy without webpack bundling it twice.
 * Enqueued only when a masonry or mosaic gallery is present on the page.
 * Both init scripts declare this as a WordPress script dependency so it
 * always executes first, even though all three scripts are deferred.
 */

import Isotope from 'isotope-layout';
import 'isotope-packery'; // registers the packery layout mode with Isotope's mode registry

window.IsotopeLib = Isotope; // eslint-disable-line no-undef
