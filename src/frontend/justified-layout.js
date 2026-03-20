/**
 * justified-layout library bundle.
 *
 * Assigns the justified-layout function to window.JustifiedLayoutLib.
 * Enqueued as a WordPress script dependency of init-justified.js.
 */

import justifiedLayout from 'justified-layout';

window.JustifiedLayoutLib = justifiedLayout; // eslint-disable-line no-undef
