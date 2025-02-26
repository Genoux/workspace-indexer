// src/services/extractors/formatter.ts
import * as notion from 'notion-types';
import { Document } from 'langchain/document';

/**
 * Format text by cleaning up common issues
 */
export function formatText(text: string): string {
  if (text == null) return '';
  
  return String(text)
    .replace(/\*/g, '')
    .replace(/\["([^"]+)"\]/g, '$1')
    .replace(/\[|\]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format database properties
 * @param properties - The properties to format
 * @returns The formatted properties
 */
export function formatDatabaseProperties(properties: notion.PropertyType): string {
  if (!properties || typeof properties !== 'object') return '';
  
  const formattedProperties = Object.entries(properties)
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, value]) => {
      const cleanKey = key.replace(/\*/g, '');
      let formattedValue = value;
      if (Array.isArray(value)) {
        formattedValue = value.join(' ');
      }
      return `${cleanKey}: ${formatText(String(formattedValue))}`;
    })
    .join('\n');
  
  return formattedProperties;
}

/**
 * Format page content
 * @param content - The content to format
 * @returns The formatted content
 */
export function formatPageContent(content: string): string {
  if (!content) return '';
  
  return formatText(content
    .replace(/<\/?(?:details|summary)[^>]*>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/Unsupported type:.*$/gm, '')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, ' ')
    .trim()
  );
}

/**
 * Format a document's content based on its type
 * @param doc - The document to format
 * @param docType - The type of document to format
 * @returns The formatted document content
 */
export function formatDocumentContent(doc: Document, docType: 'page' | 'database'): string {
  if (!doc) return '';
  
  return docType === 'database'
    ? formatDatabaseProperties(doc.metadata?.properties || {})
    : formatPageContent(doc.pageContent || '');
}