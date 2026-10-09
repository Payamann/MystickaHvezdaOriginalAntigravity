import { fileURLToPath } from 'node:url';
import { createAssetVersioning } from './asset-versioning.js';

// Share one release-aware resolver across static and server-rendered HTML.
export const publicAssetVersioning = createAssetVersioning(fileURLToPath(new URL('../../', import.meta.url)));
