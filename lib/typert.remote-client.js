import { gitGraphDescriptors, TYPERT_PACKAGE } from './typert.shared.js';
/** Client contract selected by the graph view's Cordis fiber. */
export const TYPERT_REMOTE = {
    package: TYPERT_PACKAGE,
    descriptors: gitGraphDescriptors,
};
export default TYPERT_REMOTE;
