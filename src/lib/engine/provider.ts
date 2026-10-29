import { createFrozenight } from 'chess-engine-kit';

export const createReviewEngine = () => createFrozenight({ assetBaseUrl: '/engines/frozenight/' });
