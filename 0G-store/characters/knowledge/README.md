# Knowledge Directory for RAG Implementation

This directory contains knowledge files used by Eliza's Retrieval-Augmented Generation (RAG) system. RAG allows the AI agent to provide more accurate and contextually relevant responses by retrieving information from these knowledge files.

## Directory Structure

```
knowledge/
├── shared/           # Knowledge accessible to all agents
│   ├── competetion.txt
│   ├── flow_blockchain.md
│   └── rag_explanation.md
└── README.md
```

## How It Works

1. When a user asks a question, the RAG system:
   - Processes the query
   - Searches through these knowledge files for relevant information
   - Retrieves the most contextually appropriate content
   - Uses this information to generate an informed response

2. The system has been configured in the default character settings with:
   ```javascript
   settings: {
       ragKnowledge: true,
       knowledge: {
           directory: "knowledge",
           shared: true
       }
   }
   ```

## Adding More Knowledge

To add more knowledge files:

1. Place new files in the appropriate directory:
   - `/knowledge/shared/` for knowledge accessible to all agents
   - `/knowledge/{agent-name}/` for agent-specific knowledge

2. Supported file formats:
   - Markdown (.md)
   - Text (.txt)
   - PDF (.pdf)

3. Files will be automatically processed and made available to the RAG system

## Best Practices

- Organize content into clear, focused documents
- Use descriptive filenames
- Keep individual files reasonably sized
- Use markdown formatting for better structure in .md files
