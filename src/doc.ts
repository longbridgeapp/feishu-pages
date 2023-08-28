import { Doc } from './feishu';

export const fetchDocBody = async (doc: Doc) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
};
