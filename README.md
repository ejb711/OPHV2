# OPHV2 - Louisiana Department of Health Operations Hub

A comprehensive web application for managing communications projects, user administration, and operational workflows for the Louisiana Department of Health.

## Overview

OPHV2 is a full-stack application built with Vue 3 and Firebase, designed to streamline project management and communications for health operations across Louisiana. The system provides robust features for project tracking, user management, document handling, and analytics.

## Key Features

### Communications Module
- **Project Management**: Create, track, and manage health communication projects
- **Multi-Region Support**: Organized by Louisiana parishes and regions
- **Coordinator Assignment**: Assign and track project coordinators with workload balancing
- **Advanced Search**: Full-text search with saved filters and search history
- **File Management**: Upload, version, and manage project documents
- **Project Forums**: Built-in messaging for team collaboration
- **Analytics Dashboard**: Real-time metrics and KPI tracking

### User Management
- **Role-Based Access Control (RBAC)**: Granular permission system
- **User Lifecycle Management**: Handle user creation, updates, and deactivation
- **Audit Logging**: Comprehensive activity tracking
- **Bulk Operations**: Manage multiple users efficiently
- **Password Management**: Secure password reset and policy enforcement

### System Features
- **Real-time Updates**: Live data synchronization across users
- **Responsive Design**: Optimized for desktop and mobile devices
- **Export Capabilities**: Generate CSV and PDF reports
- **Performance Monitoring**: System health and usage analytics
- **Security**: Firebase Authentication with custom claims

## Technology Stack

### Frontend
- **Vue 3**: Progressive JavaScript framework
- **Vuetify 3**: Material Design component library
- **Vite**: Next-generation build tool
- **Pinia**: State management
- **Vue Router**: Client-side routing

### Backend
- **Firebase Authentication**: User authentication and authorization
- **Cloud Firestore**: NoSQL document database
- **Cloud Functions**: Serverless backend logic
- **Cloud Storage**: File storage and management
- **Firebase Hosting**: Web application hosting

## Project Structure

```
OPHV2/
├── client/              # Vue.js frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── views/       # Page components
│   │   ├── stores/      # Pinia state management
│   │   ├── composables/ # Vue composition API utilities
│   │   ├── router/      # Route definitions
│   │   └── utils/       # Helper functions
│   └── dist/           # Production build
├── functions/          # Firebase Cloud Functions
│   └── src/
│       ├── auth/       # Authentication triggers
│       ├── users/      # User management functions
│       ├── comms/      # Communications module functions
│       └── system/     # System utilities
└── scripts/           # Maintenance and setup scripts
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase CLI
- A Firebase project with Firestore, Authentication, and Storage enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/OPHV2.git
cd OPHV2
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install functions dependencies
cd ../functions
npm install
```

3. Configure Firebase:
```bash
firebase use --add
# Select your Firebase project
```

4. Set up environment variables:
- Copy `.env.example` to `.env` in the client directory
- Update with your Firebase configuration

### Development

Run the development server:
```bash
cd client
npm run dev
```

Deploy Firebase Functions locally:
```bash
firebase emulators:start --only functions
```

### Building for Production

Build the client application:
```bash
cd client
npm run build
```

### Deployment

Deploy the entire application:
```bash
# Deploy everything
firebase deploy

# Deploy specific components
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## Documentation

- [Client Documentation](./client/README.md) - Frontend architecture and components
- [Functions Documentation](./functions/README.md) - Backend API and functions
- [Security Guide](./README-SECURITY.md) - Security best practices
- [Deployment Guide](./README-DEPLOYMENT.md) - Deployment procedures
- [Communications Module](./README-COMMS-PROJECT.md) - Communications feature documentation

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the coding standards
3. Write or update tests as needed
4. Submit a pull request with a clear description

## Support

For issues and questions:
- Check the [troubleshooting guide](./docs/TROUBLESHOOTING.md)
- Review existing [GitHub issues](https://github.com/yourusername/OPHV2/issues)
- Contact the development team

## License

This project is proprietary software for the Louisiana Department of Health.
