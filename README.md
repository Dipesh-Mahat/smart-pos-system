# Smart POS - Smart Point of Sale System

A modern, secure, and feature-rich point of sale system designed for businesses of all sizes.

## Project Overview

Smart POS is a comprehensive point of sale solution that includes:

- Intuitive and responsive frontend interface
- Secure backend with OAuth authentication
- Inventory management
- Transaction processing
- Financial reporting
- User management with role-based access control

## Repository Structure

This repository is organized into the following main directories:

- **frontend/**: Contains all frontend code (Static HTML/CSS/JS)
  - **public/**: Static assets and HTML pages
    - **css/**: Stylesheets (using standard naming conventions)
    - **js/**: JavaScript files for client-side functionality
    - **images/**: Organized image assets
      - **logos/**: Brand logos and favicons
      - **icons/**: UI icons and feature illustrations
      - **avatars/**: User profile and testimonial images
      - **screenshots/**: Product showcase images
    - **pages/**: HTML pages for different sections of the application
  - **package.json**: Frontend dependencies (minimal for static site)

- **backend/**: Contains all server-side code
  - **config/**: Configuration files including OAuth settings
  - **controllers/**: API route controllers
  - **middleware/**: Express middleware for auth, security, etc.
  - **models/**: Database models
  - **routes/**: API route definitions
  - **utils/**: Utility functions
  - **logs/**: System and security logs

## Technology Stack

### Frontend
- **HTML5/CSS3/JavaScript**: Core frontend technologies
- **Static Site**: No framework dependencies for optimal performance
- **Responsive Design**: Mobile-first approach

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **MongoDB**: Database with Atlas cloud hosting
- **JWT**: Authentication tokens
- **Google OAuth**: Third-party authentication

## Security Features

Smart POS implements multiple layers of security:

- JWT authentication
- Google OAuth integration
- CSRF protection
- Helmet security headers
- Rate limiting
- Role-based access control (RBAC)

## Development Workflow

### Branch Structure

- `main`: Production-ready code
- `frontend`: UI and client-side functionality
- `backend`: Server-side API and business logic
- `database`: Database schema and query optimization
- `security`: Authentication, authorization, and security features
- `ocr`: Optical Character Recognition implementation for receipt scanning

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

We use a simple role-based branching strategy with 5 core branches as assigned by supervisor:

- **main**: Production-ready code
- **frontend**: UI and client-side functionality development
- **backend**: Server-side API and business logic development
- **database**: Database schema and query optimization
- **security**: Authentication, authorization, and security features
- **ocr**: Optical Character Recognition implementation for receipt scanning

## File Organization Standards

- All filenames use kebab-case (e.g., user-profile.html, landing-page.css)
- CSS files are organized in the `frontend/public/css` directory
- JavaScript files are in `frontend/public/js` directory
- Images follow a consistent naming convention:
  - All image filenames use kebab-case (e.g., user-avatar.png, barcode-icon.png)
  - Icon files are named with `-icon` suffix (e.g., document-icon.png)
  - UI element images have descriptive names (e.g., export-data.png)
- HTML files are organized in `frontend/public/pages`
- File references use relative paths (e.g., "../css/styles.css", "../images/user-avatar.png")
