export interface Config {
  notion: {
    id: string;
    docType: 'page' | 'database';
  };
  pinecone: {
    index: string;
    namespace: string;
  };
}
