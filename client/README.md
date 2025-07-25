# OPHV2 Client - Frontend Application

## Overview

The OPHV2 client is a Vue 3 application that provides the user interface for the Louisiana Department of Health Operations Hub. It features a modern, responsive design with comprehensive user management, communications project tracking, and analytics capabilities.

## Technology Stack

- **Vue 3** - Progressive JavaScript framework
- **Vuetify 3** - Material Design component library
- **Vite** - Fast build tool and development server
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Firebase SDK** - Authentication and real-time database

## Project Structure

```
client/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── admin/         # Admin panel components
│   │   ├── auth/          # Authentication components
│   │   ├── comms/         # Communications module
│   │   ├── layout/        # Layout components
│   │   └── shared/        # Shared utilities
│   ├── composables/       # Vue Composition API utilities
│   ├── views/             # Page-level components
│   ├── stores/            # Pinia state management
│   ├── router/            # Route configurations
│   ├── utils/             # Helper functions
│   └── assets/            # Static assets and styles
├── public/                # Public static files
└── dist/                  # Production build output
```

## Key Features

### Authentication & Authorization
- Firebase Authentication integration
- Role-based access control (RBAC)
- Permission-based UI rendering
- Session management

### User Management
- Complete CRUD operations
- Role assignment and management
- Custom permissions per user
- Bulk user operations
- Activity auditing

### Communications Module
- Project creation and management
- Multi-region support (Louisiana parishes)
- Coordinator assignment
- File management with versioning
- Project forums for collaboration
- Advanced search and filtering
- Analytics dashboard

### UI/UX Features
- Responsive design for all screen sizes
- Material Design components
- Real-time data updates
- Loading states and error handling
- Snackbar notifications
- Keyboard navigation support

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project configured

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Update .env with your Firebase configuration
```

### Environment Variables

Required in `.env`:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Development Server

```bash
# Start development server
npm run dev

# The application will be available at http://localhost:5173
```

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Component Architecture

### Permission-Based Components

Components use the `PermissionGuard` wrapper for conditional rendering:

```vue
<PermissionGuard permission="manage_users">
  <UserManagement />
</PermissionGuard>
```

### Composables

Key composables for common functionality:

- `usePermissions` - Permission checking utilities
- `useSnackbar` - Global notification system
- `useErrorHandler` - Centralized error handling
- `useAudit` - Audit logging functionality
- `useCommsDashboard` - Communications analytics

### State Management

Pinia stores manage application state:

- `auth` - User authentication and permissions
- `permissions` - System-wide permission data

## Routing

Routes are protected by authentication and permission guards:

```javascript
{
  path: '/admin',
  component: AdminView,
  meta: { 
    requiresAuth: true,
    requiresPermission: 'view_admin_panel'
  }
}
```

## Styling

The application uses:
- Vuetify 3 components for consistency
- Custom CSS modules for specific features
- Louisiana Department of Health brand colors
- Responsive design patterns

## Testing

```bash
# Run unit tests
npm run test:unit

# Run e2e tests
npm run test:e2e
```

## Performance Optimization

- Lazy loading for routes and heavy components
- Code splitting for optimal bundle sizes
- Efficient Firestore query patterns
- Debounced search operations
- Virtual scrolling for large lists

## Security Best Practices

- All API calls require authentication
- Permission checks on both client and server
- Input validation and sanitization
- XSS protection through Vue's template system
- CORS properly configured

## Deployment

The client is deployed to Firebase Hosting:

```bash
# Build and deploy
npm run build
firebase deploy --only hosting
```

## Troubleshooting

### Common Issues

1. **Login Problems**
   - Verify Firebase Auth configuration
   - Check user account status in Firebase Console
   - Ensure correct permissions are assigned

2. **Permission Denied**
   - Check user's role and permissions
   - Verify Firestore security rules
   - Ensure permission names match exactly

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check for TypeScript errors
   - Verify environment variables

## Contributing

1. Follow Vue 3 composition API patterns
2. Use Vuetify components when possible
3. Maintain consistent error handling
4. Add appropriate permission checks
5. Update tests for new features
6. Keep components focused and modular

## Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vuetify 3 Documentation](https://vuetifyjs.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/)