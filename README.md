# Local AI Assistant

A modern web interface for interacting with various AI models, including local Ollama models and cloud providers like OpenAI, Anthropic, and Google.

## Features

- 🤖 Support for multiple AI models:
  - Local Ollama models (Llama 2, CodeLlama, Mistral, etc.)
  - OpenAI GPT models
  - Anthropic Claude models
  - Google Gemini models
- 📁 File upload support for various formats:
  - Documents (PDF, Word, Excel)
  - Archives (ZIP)
  - Images
  - Text files
- 💻 Local system interaction capabilities
- 🎨 Beautiful, modern, and responsive UI
- 🔒 Secure API key management
- 📝 Code block highlighting and easy copying

## Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Ollama (optional, for local models)

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/local-ai-assistant.git
   cd local-ai-assistant
   ```

2. Choose your platform's startup script:

   - **Windows**: Double-click `scripts/start.bat`
   - **macOS**: Double-click `scripts/start.command`
   - **Linux**: Run `./scripts/start.sh`

The script will:
- Install dependencies (if needed)
- Build the project
- Start the server

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Configuration

1. **Ollama Setup**
   - Install Ollama from [ollama.ai](https://ollama.ai)
   - Pull your desired models using `ollama pull model-name`
   - The default endpoint is `http://localhost:11434`

2. **API Keys (Optional)**
   - OpenAI: Get your API key from [OpenAI](https://platform.openai.com)
   - Anthropic: Get your API key from [Anthropic](https://console.anthropic.com)
   - Google: Get your API key from [Google AI Studio](https://makersuite.google.com)

## Usage

1. Select your desired model from the sidebar
2. For cloud models (OpenAI, Anthropic, Google), enter your API key in the settings
3. For Ollama models, ensure Ollama is running and the endpoint is correct
4. Upload files using the file uploader
5. Start chatting!

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## License

MIT License - feel free to use this project for any purpose.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 