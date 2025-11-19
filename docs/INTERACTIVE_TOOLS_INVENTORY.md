# Interactive Tools Inventory

This document lists all interactive tools and components promised/implemented to make learning more interesting.

## ✅ Implemented Interactive Tools

### 1. **Coin Flip Simulation & Convergence**
- **Components**: `FlipCard`, `FlipConvergence`
- **Location**: `components/demos/FlipCard.tsx`, `components/demos/FlipConvergence.tsx`
- **Features**:
  - Visual coin flip animation (Heads/Tails)
  - Running mean convergence chart (Law of Large Numbers)
  - Real-time probability estimation (p̂)
  - Configurable flip speed and batch size
  - Auto-pause when tab is hidden
  - Color/B&W mode toggle
- **Used in**: Lessons (via markdown component embedding)

### 2. **Visual Markov Chain Builder**
- **Location**: `app/tools/page.tsx`
- **Features**:
  - Drag-and-drop state creation
  - Visual transition creation (click source → target)
  - Transition probability editing
  - Initial/Final state marking
  - Transition labels for DFA/NFA mode
  - Zoom and pan (including pinch-to-zoom)
  - Save/Load designs (localStorage + Supabase)
  - Export/Import JSON format
  - Canvas with grid background
  - State color coding (initial=green, final=red)

### 3. **Chain Simulation**
- **Location**: `app/tools/page.tsx` - Simulate tab
- **Features**:
  - Step-by-step simulation
  - Auto-run simulation with speed control (50-1000ms)
  - State visit tracking
  - Transition usage metrics
  - Path history visualization
  - Current state highlighting
  - Simulation metrics display

### 4. **String Acceptance Testing**
- **Location**: `app/tools/page.tsx` - Simulate tab
- **Features**:
  - Input field to test strings against automata
  - Visual path highlighting as string is processed
  - Accept/Reject indicators (green checkmark for ACCEPTED, red X for REJECTED)
  - Step-by-step trace showing state transitions
  - Speed control for visualization (50-1000ms)
  - Support for both probabilistic (Markov) and deterministic (DFA/NFA) modes
  - Transition labels for DFA/NFA mode (single character labels)

### 5. **Text Generation from Markov Chains**
- **Location**: `lib/text-generation.ts`, `app/tools/page.tsx` - Simulate tab
- **Features**:
  - Generate text based on Markov chain transitions
  - Start from initial state (or specified state)
  - Sample transitions probabilistically
  - Generate sequences of state names
  - Length control (1-100)
  - Probabilistic and deterministic modes
  - Copy to clipboard functionality

### 6. **Language Recognition & Analysis**
- **Location**: `lib/language-analysis.ts`, `app/tools/page.tsx` - Analyze tab
- **Features**:
  - Identify what language the automaton recognizes (regular language detection)
  - Generate example strings that are accepted/rejected
  - Show language properties (finite, empty, universal)
  - Language description display
  - Alphabet extraction from transitions
  - Regular expression computation (basic cases)

### 7. **Convergence Analysis**
- **Location**: `lib/markov-analysis.ts`, `app/tools/page.tsx` - Analyze tab
- **Features**:
  - Calculate stationary distribution (steady-state probabilities) using power iteration
  - Visualize stationary distribution with progress bars
  - Chain properties detection (ergodic, irreducible, aperiodic)
  - Absorbing state detection
  - Communicating classes identification
  - Convergence iteration count display
  - Convergence status indicator

### 8. **Transition Matrix Visualization**
- **Location**: `app/tools/page.tsx` - Analyze tab
- **Features**:
  - Visual transition matrix display
  - Chain properties (state count, transition count)
  - Outgoing transitions per state validation
  - Transition probability visualization

### 9. **Weather State Transitions Demo**
- **Mentioned in**: `docs/LESSON_OUTLINES.md`
- **Status**: Planned/Referenced
- **Description**: Interactive weather state transitions demonstration

### 10. **Examples Library**
- **Location**: `app/examples/`, `data/examples.json`
- **Features**:
  - Pre-built examples (weather, PageRank, text generation, etc.)
  - Load examples into canvas
  - Examples stored in database with admin management
  - Historical context examples

## 📋 Promised but Not Yet Implemented

### Phase 3 Tools (From `docs/TOOLS_ENHANCEMENT_PLAN.md`)
1. **PDA Builder** - Pushdown Automata visual builder
2. **Turing Machine Simulator** - Visual Turing machine simulator
3. **Natural Language Processing Tools** - Advanced NLP analysis tools
4. **Advanced Mathematical Analysis** - Extended mathematical analysis features
5. **Game Theory Applications** - Game theory visualizations
6. **Tutorial/Challenge Modes** - Guided tutorials and challenges

## 📝 Notes

- All Phase 1 and Phase 2 tools are **100% complete** ✅
- Interactive components can be embedded in markdown lessons using the `component` syntax
- Components are lazy-loaded and optimized for performance
- Mobile support is available but may need improvements (see mobile dragging issue)

## 🔗 Related Documentation

- `docs/TOOLS_ENHANCEMENT_PLAN.md` - Detailed enhancement plan
- `docs/EMBEDDED_COMPONENTS.md` - How to embed components in markdown
- `docs/LESSON_OUTLINES.md` - Lesson plans mentioning interactive components
- `docs/FEATURES.md` - Feature inventory
