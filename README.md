# Ollama VRAM Calculator & Management UI

A comprehensive GUI tool for managing Ollama models and calculating VRAM requirements. This project provides a user-friendly interface for interacting with Ollama, featuring model management, VRAM calculations, benchmarking, and testing capabilities.

## Features

### 🧮 VRAM Calculator
- Calculate VRAM requirements for Ollama models
- Real-time updates based on model selection
- Detailed memory breakdown and recommendations

### 💻 Command Center
- View and manage running models
- Load and unload models with one click
- Copy and delete models
- Pull new models from Ollama library
- View detailed model information

### 🤖 Model Chat
- Interactive chat interface for testing models
- System prompt management
- Real-time model responses

### 📊 Benchmarking
- Performance testing for models
- Response time measurements
- Memory usage tracking

### 🔄 Stress Testing
- Multi-model load testing
- Concurrent chat simulations
- System performance analysis

## Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- Ollama installed and running
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/andyeswong/ollama_lab.git
cd ollama-vram-calculator
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage

### Connecting to Ollama
1. Click the Settings icon in the sidebar
2. Enter your Ollama server URL (default: http://localhost:11434)
3. Test the connection

### Features Guide

#### VRAM Calculator
- Select a model to see VRAM requirements
- View detailed memory breakdowns
- Get recommendations for your setup

#### Command Center
- View all running models
- Load/unload models with memory tracking
- Pull models from Ollama library
- View detailed model information

#### Model Chat
- Select a model to chat with
- Customize system prompts
- Test model responses

#### Benchmarking
- Run performance tests
- Compare model speeds
- Analyze response times

#### Stress Testing
- Test multiple models simultaneously
- Monitor system performance
- Analyze concurrent usage

## Technical Stack

- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **API Integration**: Ollama HTTP API

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Author

- **Andres Wong** - _Initial work and development_

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Ollama](https://ollama.ai/) for the amazing model management system
- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- All contributors who test and suggest improvements

## Support

For support, please open an issue in the GitHub repository or contact the author.
