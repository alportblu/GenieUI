GenieUI

GenieUI is a modern, AI-powered web interface designed to streamline interactions with various AI models, including OpenAI, Anthropic, Groq, and Google. Built with Next.js and TypeScript, it offers a seamless user experience for developers and end-users alike.

🚀 Features
Multi-Model Support: Integrates with multiple AI providers for versatile AI interactions.

Modular Architecture: Clean and maintainable codebase with a focus on scalability.

Responsive Design: Optimized for various devices to ensure accessibility.

API Routes: Dedicated API routes for each AI provider to handle requests efficiently.

Context Management: Utilizes React Context for state management across components.

Testing: Includes unit tests to ensure component reliability.​
GitHub

🛠️ Technologies Used
Framework: Next.js

Language: TypeScript

Styling: Tailwind CSS

Testing: Jest, React Testing Library

API Integration: Axios​

📂 Project Structure
bash
Copy
Edit
GenieUI/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js pages and layouts
│   ├── components/         # Reusable UI components
│   ├── lib/                # Utility functions and API integrations
│   └── tests/              # Unit and integration tests
├── .env.example            # Sample environment variables
├── .gitignore              # Git ignore rules
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # Project documentation
⚙️ Getting Started
Prerequisites
Node.js (v14 or later)

npm or yarn​
Reddit
+2
Stack Overflow
+2
GitHub
+2

Installation
bash
Copy
Edit
# Clone the repository
git clone https://github.com/alportblu/GenieUI.git
cd GenieUI

# Install dependencies
npm install
# or
yarn install
Running the Development Server
bash
Copy
Edit
npm run dev
# or
yarn dev
Visit http://localhost:3000 to view the application.​
Medium
+4
GitHub
+4
DEV Community
+4

Building for Production
bash
Copy
Edit
npm run build
# or
yarn build
Running Tests
bash
Copy
Edit
npm run test
# or
yarn test
🔐 Environment Variables
Create a .env.local file in the root directory and configure the following variables:​

env
Copy
Edit
# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key

# Anthropic API Key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Groq API Key
GROQ_API_KEY=your-groq-api-key

# Google API Key
GOOGLE_API_KEY=your-google-api-key
Refer to .env.example for a complete list of required environment variables.​
DEV Community
+5
Reddit
+5
GitHub
+5

📄 License
This project is licensed under the MIT License.​
GitHub

