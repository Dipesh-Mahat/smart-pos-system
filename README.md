# NeoPOS - Smart Point of Sale System

A modern, secure, and feature-rich point of sale system designed for businesses of all sizes.

## Project Overview

NeoPOS is a comprehensive point of sale solution that includes:

- Intuitive and responsive frontend interface
- Secure backend with OAuth authentication
- Inventory management
- Transaction processing
- Financial reporting
- User management with role-based access control

## Repository Structure

This repository is organized into the following main directories:

- **frontend/**: Contains all frontend code
  - **public/**: Static assets and HTML pages
  - **src/**: React components and application logic
- **backend/**: Contains server-side code
  - **config/**: Configuration files and secrets management
  - **controllers/**: Business logic
  - **middleware/**: Request processing middleware
  - **models/**: Data models
  - **routes/**: API endpoints
  - **utils/**: Utility functions

## Security Features

NeoPOS implements multiple layers of security:

- JWT authentication
- Google OAuth integration
- CSRF protection
- Helmet security headers
- Rate limiting
- Role-based access control (RBAC)

## Development Workflow

### Branch Structure

- `main`: Production-ready code
- `staging`: Pre-production testing
- `development`: Integration of features
- Feature branches: `feature/frontend`, `feature/backend`, etc.

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   cd frontend
   npm install
   cd ../backend
   npm install
   ```
3. Set up environment variables
4. Start the development servers

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs both the backend and frontend in development mode.

### `npm run backend`

Runs only the backend server.

### `npm run frontend`

Runs only the frontend development server.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
