# Workspace Indexer

## Overview

Workspace Indexer is a Node.js application that automatically syncs and embeds creator data into a vector database with regular validation and versioning. It extracts data from Notion, generates embeddings, and indexes them into Pinecone for efficient semantic search capabilities.

## Features

- **Notion Integration**: Extracts data from Notion databases and pages
- **Embedding Generation**: Converts text data into vector embeddings
- **Vector Database Indexing**: Stores embeddings in Pinecone for semantic search
- **Caching**: Optimizes performance by caching previously processed documents
- **Progress Tracking**: Real-time progress indicators during extraction, embedding, and indexing
- **Error Handling**: Robust error handling with detailed logging

## Architecture

The application follows a pipeline architecture:

1. **Extraction**: Pulls data from Notion using the Notion API
2. **Embedding**: Generates vector embeddings for the extracted content
3. **Indexing**: Stores the embeddings in Pinecone for semantic search

## Getting Started

1. Clone the repository
2. Create a `.env` file with your API keys (see Environment Variables section)
3. Install dependencies: `pnpm install`
4. Build the project: `pnpm build`
5. Run the indexer: `pnpm start creator-faq`

## Supported Document Types

- `creator-faq`: Creator FAQ documentation that contains comprehensive information about the platform's features, policies, and best practices for creators. This document is structured as a Notion page with sections and subsections that are processed and indexed for semantic search.

## Prerequisites

- Node.js (v16+)
- Notion API access
- Pinecone account and API key
- OpenAI API key (for embeddings)

## Environment Variables

Create a `.env` file with the following variables:

```env
NOTION_API_KEY=your_notion_api_key
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
```

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Usage

```bash
# Run the indexer for a specific document type
pnpm start creator-faq

# Available document types
# - creator-faq

# Development mode
pnpm dev creator-faq
```

## Development

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

## Troubleshooting

### Common Issues

1. **API Rate Limiting**: If you encounter rate limiting issues with Notion or OpenAI APIs, try increasing the delay between requests in the extraction and embedding services.

2. **Embedding Generation Failures**: If embedding generation fails, check your OpenAI API key and ensure you have sufficient credits.

3. **Pinecone Connection Issues**: Verify your Pinecone API key and environment settings. Make sure the specified index exists in your Pinecone account.

4. **Missing Environment Variables**: Ensure all required environment variables are properly set in your `.env` file.

## Roadmap

Future plans for the Workspace Indexer include:

- Support for additional document types
- Integration with other data sources beyond Notion
- Enhanced caching mechanisms for improved performance
- Real-time synchronization capabilities
- Advanced filtering and search options

## Project Structure

- `src/`
  - `config/`: Configuration files for documents, environment, and prompts
  - `pipeline/`: Main processing pipeline
  - `services/`: Core services for extraction, embedding, and indexing
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions
  - `index.ts`: Application entry point

## License

ISC
