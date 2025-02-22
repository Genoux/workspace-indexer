import { Document } from 'langchain/document';
import * as notion from 'notion-types';

export function formatNotionContent(doc: Document, docType: 'page' | 'database'): string {
  if (!doc) return '';
  
  return docType === 'database'
    ? formatDatabaseProperties(doc.metadata.properties)
    : formatPageContent(doc.pageContent);
}

function formatDatabaseProperties(properties: notion.PropertyType): string {
  if (!properties || typeof properties !== 'object') return '';

  return Object.entries(properties)
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

export function formatPageContent(content: string): string {
  if (!content) return '';
  
  return content
    .replace(/<\/?(?:details|summary)[^>]*>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}