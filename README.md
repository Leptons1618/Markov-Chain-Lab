<div align="center">

# Markov Learning Lab

**Interactive Markov Chains Learning Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-green)](https://supabase.com/)

*Learn, build, and experiment with Markov Chains through interactive visualizations and hands-on tools*

[Features](#-features) • [Quick Start](#-quick-start) • [Tools Showcase](#-tools-showcase) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## Features

### **Interactive Learning**
- **Guided Curriculum**: Step-by-step lessons covering Markov Chains fundamentals
- **Interactive Demos**: Coin flip simulations, convergence visualizations, and real-world examples
- **Practice Quizzes**: MCQ, True/False, and Numerical questions with instant feedback
- **Resource Library**: Curated academic papers, books, and educational materials

### **Powerful Tools**

#### **Visual Chain Builder**
- **Drag-and-Drop Interface**: Create states and transitions visually
- **Multiple Automaton Types**: Markov Chains, DFA, and NFA support
- **Real-time Simulation**: Step through transitions with visual feedback
- **Advanced Analysis**: Transition matrices, convergence analysis, and language recognition
- **Save & Export**: Save designs to cloud or export as JSON

#### **Grammar Editor**
- **Two-way Conversion**: Convert between grammars and automata
- **Real-time Validation**: Instant feedback on grammar syntax
- **Example Library**: Pre-built grammars to learn from
- **CFG Detection**: Smart detection of context-free vs regular grammars

#### **String Acceptance Testing**
- **Visual Path Tracing**: See exactly how strings are processed
- **Animated Transitions**: Step-by-step visualization with speed control
- **Accept/Reject Indicators**: Clear visual feedback for string acceptance

#### **Convergence Analysis**
- **Stationary Distribution**: Calculate and visualize steady states
- **Convergence Rate**: Understand how quickly chains converge
- **Chain Properties**: Ergodic, irreducible, aperiodic analysis

### **Modern UI/UX**
- **Dark Mode Support**: Beautiful themes for any preference
- **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Performance Optimized**: Fast loading with parallel data fetching
- **Accessible**: Keyboard navigation and screen reader support

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- Supabase account (for authentication and persistence)

### Installation

```bash
# Clone the repository
git clone https://github.com/Leptons1618/markov-chain-lab.git
cd markov-chain-lab

# Install dependencies
npm install
# or
pnpm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Setup

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Full Setup Guides:**
- **[Admin Setup](docs/ADMIN_SETUP.md)** - Admin authentication and user management
- **[Authentication Setup](docs/AUTHENTICATION_SETUP.md)** - User authentication configuration

---

## Tools Showcase

### Interactive Chain Builder

The Tools page is the heart of Markov Learning Lab. Here's what you can do:

### Screenshots Gallery

<div align="center">

| Chain Builder | Simulation | Grammar Editor | Analysis |
|:---:|:---:|:---:|:---:|
| ![Chain Builder](public/screenshots/chain-builder.jpeg) | ![Simulation](public/screenshots/simulation.jpeg) | ![Grammar Editor](public/screenshots/grammar-editor.jpeg) | ![Analysis](public/screenshots/analysis.jpeg) |
| *Visual chain builder with drag-and-drop states* | *Real-time simulation with path highlighting* | *Grammar editor with two-way conversion* | *Advanced analysis and transition matrices* |

</div>

#### Key Features

| Feature | Description |
|---------|-------------|
| **Visual Builder** | Click to add states, connect them with transitions |
| **Automaton Types** | Switch between Markov Chains, DFA, and NFA |
| **Probability Control** | Fine-tune transition probabilities with number inputs |
| **Label Support** | Add character labels for DFA/NFA transitions |
| **Zoom & Pan** | Navigate large chains with mouse/touch gestures |
| **Design Rules** | Built-in guidelines for optimal node placement |
| **Grammar Conversion** | Convert automata to grammars and vice versa |
| **Language Recognition** | Analyze what language your automaton recognizes |
| **Text Generation** | Generate sequences by walking through the chain |
| **Convergence Analysis** | Calculate stationary distributions and properties |

#### Build Tab Features
- **State Management**: Add, delete, and customize states
- **Transition Editing**: Set probabilities or labels
- **Initial/Final States**: Mark states as initial or final
- **Design Guidelines**: Built-in rules for node placement
- **Auto Layout**: Smart positioning when converting from grammar

#### Simulate Tab Features
- **Step-by-Step Simulation**: Manual control over transitions
- **Auto-Run Mode**: Automatic simulation with speed control
- **String Testing**: Test strings against DFA/NFA automata
- **Path Visualization**: See the exact path through states
- **Metrics Tracking**: State visits and transition usage

#### Analyze Tab Features
- **Transition Matrix**: Visual representation of probabilities
- **Chain Properties**: State count, transition validation
- **Convergence Analysis**: Stationary distribution (Markov chains)
- **Language Analysis**: Recognized strings and examples (DFA/NFA)

#### Grammar Tab Features
- **Grammar Editor**: Write grammars in standard notation
- **Real-time Parsing**: Instant validation and error detection
- **Example Library**: Pre-built grammars to learn from
- **Two-way Conversion**: Grammar ↔ Automaton conversion
- **CFG Detection**: Smart detection of grammar types

---

## Documentation

Comprehensive guides for development, setup, and usage:

| Document | Description |
|----------|-------------|
| **[Architecture](docs/ARCHITECTURE.md)** | System design and technical decisions |
| **[Features](docs/FEATURES.md)** | Complete feature list and capabilities |
| **[Interactive Tools](docs/INTERACTIVE_TOOLS_INVENTORY.md)** | All interactive components and demos |
| **[Testing Guide](docs/TESTING_GUIDE.md)** | Playwright test suite and visual regression |
| **[Roadmap](docs/ROADMAP.md)** | Future plans and enhancements |
| **[Lesson Outlines](docs/LESSON_OUTLINES.md)** | Detailed lesson structures |
| **[Research Sources](docs/SOURCES.md)** | Curated academic and educational resources |
| **[Troubleshooting](docs/TROUBLESHOOTING.md)** | Common issues and solutions |

---

## Project Structure

```
markov-learning-lab/
├── app/                    # Next.js App Router pages
│   ├── learn/             # Learning modules and lessons
│   ├── tools/             # Chain Builder and tools
│   ├── examples/          # Example catalog and case studies
│   ├── practice/          # Quiz engine
│   └── resources/         # Library and references
├── components/            # React components
│   ├── ui/               # UI primitives (shadcn-style)
│   ├── demos/            # Interactive demos
│   └── auth/             # Authentication components
├── lib/                   # Utilities and helpers
│   ├── grammar-parser.ts # Grammar parsing and conversion
│   ├── markov-analysis.ts # Chain analysis algorithms
│   └── language-analysis.ts # Language recognition
├── data/                  # Content data (JSON)
├── docs/                  # Documentation
└── public/                # Static assets
```

---

## Learning Path

1. **Start with Basics** → Explore the Learn section for fundamental concepts
2. **Try Examples** → Load pre-built examples in the Tools page
3. **Build Your Own** → Create custom chains with the visual builder
4. **Experiment** → Use simulation and analysis tools to understand behavior
5. **Practice** → Test your knowledge with quizzes
6. **Go Deeper** → Explore resources and academic papers

---

## Deployment

### Deploy to Vercel

1. **Connect Repository** to [Vercel](https://vercel.com)
2. **Set Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
3. **Configure Supabase** redirect URLs
4. **Deploy!** 

Vercel automatically detects Next.js and configures the build. Add custom domains as needed. My app is live at `https://www.markovchainlab.dev/`.

---

## Roadmap

### Completed
- Visual Chain Builder with drag-and-drop
- Multiple automaton types (Markov, DFA, NFA)
- Grammar Editor with two-way conversion
- String acceptance testing
- Convergence analysis
- Mobile-responsive design
- Save/Load designs (Supabase)

### In Progress
- Enhanced validation and error handling
- More example grammars and chains
- Advanced analysis tools

### Planned
- MDX-based lesson content
- More interactive demos
- Collaborative features
- Export to various formats
- Performance optimizations

See [ROADMAP.md](docs/ROADMAP.md) for detailed plans.

---

## Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs**: Open an issue with detailed information
2. **Suggest Features**: Share your ideas for improvements
3. **Submit PRs**: Fork, make changes, and submit pull requests
4. **Improve Docs**: Help make documentation better
5. **Add Examples**: Contribute interesting chain examples

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

---

## License

This project is licensed under the GPLv3 License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Supabase](https://supabase.com/) for backend services
- Charts powered by [Recharts](https://recharts.org/)

---

<div align="center">

**Made with ❤️ for learners and educators**

[Report Bug](https://github.com/Leptons1618/markov-chain-lab/issues) • [Request Feature](https://github.com/Leptons1618/markov-chain-lab/issues) • [Documentation](docs/)

</div>
