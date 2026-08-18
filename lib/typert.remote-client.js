import { gitGraphCompareInvocation, gitGraphDescriptors, gitGraphFileDiffInvocation, gitGraphFileInvocation, gitGraphMetadataInvocation, gitGraphReadCommitInvocation, gitGraphWorkingTreeFileInvocation, gitGraphWorkingTreeInvocation, TYPERT_PACKAGE, } from './typert.shared.js';
/** Client contract selected by the graph view's Cordis fiber. */
export const TYPERT_REMOTE = {
    package: TYPERT_PACKAGE,
    descriptors: gitGraphDescriptors,
};
export { gitGraphReadCommitInvocation, gitGraphFileInvocation, gitGraphFileDiffInvocation, gitGraphWorkingTreeInvocation, gitGraphWorkingTreeFileInvocation, gitGraphCompareInvocation, gitGraphMetadataInvocation, };
export default TYPERT_REMOTE;
