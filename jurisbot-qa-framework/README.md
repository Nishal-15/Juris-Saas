# JurisBot Enterprise QA Automation Framework

This is a comprehensive, production-ready, modular testing framework designed for **JurisBot** — an AI-powered Legal Intelligence Platform. 
It guarantees enterprise software quality covering UI, API, Security, Performance, Load, Accessibility, and rigorous AI Validations.

## 🏗 Framework Architecture
```
jurisbot-qa-framework/
├── tests/
│   ├── e2e/              # Playwright UI Tests (Citizen & Lawyer portals)
│   ├── api/              # Bruno API Tests & Collections
│   ├── unit/             # Vitest (Frontend) & Jest (Backend)
│   ├── integration/      # Jest Backend Integration
│   ├── security/         # OWASP ZAP Automation Scripts
│   ├── performance/      # Lighthouse & Core Web Vitals Scripts
│   ├── accessibility/    # Axe Playwright Tests
│   ├── load/             # k6 Load Testing Scripts
│   └── ai_validation/    # Specialized JurisBot Legal AI Validation Suite
├── pages/                # Page Object Model (POM) for Playwright
├── fixtures/             # Reusable Test Fixtures
├── utils/                # Utility Functions (DB connections, Token generators)
├── test-data/            # Mock Data and JSON Payloads
├── reports/              # HTML, JSON, XML, and Coverage Reports
├── .github/workflows/    # CI/CD Pipelines
├── playwright.config.js  # Playwright Setup
├── vitest.config.js      # Frontend Unit Test Setup
├── jest.config.js        # Backend Unit/Integration Test Setup
└── package.json          # Dependencies & Scripts
```

## 🚀 Quick Start (Phase 1)

1. **Install Dependencies**
   ```bash
   cd jurisbot-qa-framework
   npm install
   ```

2. **Install Browsers (Playwright)**
   ```bash
   npx playwright install --with-deps
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root of the `jurisbot-qa-framework` directory:
   ```env
   CITIZEN_URL=https://juris-saas.pages.dev
   LAWYER_URL=https://jurisbot-lawyer.pages.dev
   BACKEND_API_URL=https://your-backend.onrender.com/api
   TEST_USER_EMAIL=test@jurisbot.com
   TEST_USER_PASSWORD=YourSecurePassword!
   ```

## 🛠 Available Commands

| Command | Description |
|---|---|
| `npm run test:e2e` | Run all End-to-End Playwright Tests (Headless) |
| `npm run test:e2e:ui` | Open Playwright UI mode for debugging |
| `npm run test:api` | Run Bruno API Tests |
| `npm run test:unit:frontend` | Run Frontend Unit Tests (Vitest) |
| `npm run test:unit:backend` | Run Backend Unit Tests (Jest) |
| `npm run test:security` | Run OWASP ZAP Security Scan |
| `npm run test:perf` | Run Google Lighthouse Performance & SEO tests |
| `npm run test:load` | Run k6 Load & Stress Tests |
| `npm run test:ai` | Run JurisBot Legal AI Accuracy & Safety Validations |
| `npm run lint` | Lint Codebase |

## 🛡 JurisBot AI Validation Suite
This framework includes a dedicated `test:ai` suite specifically built to validate the JurisBot AI. It strictly ensures:
- **Current Law Enforcement**: Verifies the AI cites BNS, BNSS, and BSA instead of repealed laws.
- **Prompt Injection Defense**: Validates that system prompts and environment variables cannot be leaked.
- **RBAC Data Security**: Ensures document vaults are strictly isolated.
- **Legal Disclaimers**: Asserts mandatory liability disclaimers exist in AI responses.

## 🔄 CI/CD Integration
GitHub Actions workflows are located in `.github/workflows/`. They are configured to run automatically on Pull Requests and Merges to the `main` branch, failing the pipeline if critical quality gates are not met.
