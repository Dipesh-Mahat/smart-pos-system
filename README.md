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
    - **css/**: Stylesheets (using standard naming conventions)
    - **js/**: JavaScript files
    - **images/**: Image assets
    - **pages/**: HTML pages for different sections of the application
  - **src/**: React components and source code (for future development)

- **backend/**: Contains all server-side code
  - **config/**: Configuration files including OAuth settings
  - **controllers/**: API route controllers
  - **middleware/**: Express middleware for auth, security, etc.
  - **models/**: Database models
  - **routes/**: API route definitions
  - **utils/**: Utility functions
  - **logs/**: System and security logs

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

## Git Branching Strategy

We use a feature-based branching strategy:

- **main**: Production-ready code
- **development**: Integration branch for active development
- **staging**: Pre-production testing
- **feature/xxx**: Feature-specific branches (e.g., feature/frontend, feature/security)

## File Organization Standards

- CSS files are organized in the `frontend/public/css` directory
- JavaScript files are in the `frontend/public/js` directory
- Images are stored in `frontend/public/images`
- HTML files are in `frontend/public/pages`
- All filenames use kebab-case (e.g., user-profile.html, landing-page.css)
- CSS references use relative paths (e.g., "../css/styles.css")
