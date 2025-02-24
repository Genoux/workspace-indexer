import { Document } from 'langchain/document';
import * as notion from 'notion-types';

export function formatNotionContent(doc: Document, docType: 'page' | 'database'): string {
  if (!doc) return '';
  return docType === 'database'
    ? formatDatabaseProperties(doc.metadata.properties) 
    : formatPageContent(doc.pageContent);
}

function formatText(text: string): string {
  return text
    .replace(/\*/g, '')
    .replace(/\["([^"]+)"\]/g, '$1')
    .replace(/\[|\]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDatabaseProperties(properties: notion.PropertyType): string {
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

export function formatPageContent(content: string): string {
  if (!content) return '';
  return formatText(content
    .replace(/<\/?(?:details|summary)[^>]*>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  );
}