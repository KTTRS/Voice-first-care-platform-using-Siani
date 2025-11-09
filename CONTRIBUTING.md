# Contributing to Sainte AI Care Platform

Thank you for your interest in contributing to Sainte! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We're building this platform to improve healthcare, and we welcome diverse perspectives.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment (see README.md)
4. Create a new branch for your feature or fix

## Development Workflow

### Branch Naming
- Feature: `feature/description-here`
- Bug fix: `fix/description-here`
- Documentation: `docs/description-here`
- Refactor: `refactor/description-here`

### Commit Messages
Follow conventional commits:
- `feat: add new signal type for blood glucose`
- `fix: resolve JWT expiration issue`
- `docs: update API documentation`
- `refactor: improve scoring algorithm`
- `test: add tests for memory service`

### Pull Request Process

1. **Update documentation** if you've changed APIs or added features
2. **Add tests** for new functionality
3. **Run linters** and fix any issues
4. **Test thoroughly** - include edge cases
5. **Update CHANGELOG** if applicable
6. **Request review** from maintainers

## Code Style

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable names
- Add comments for complex logic
- Maximum line length: 100 characters

### Backend
- Use async/await, not callbacks
- Validate all inputs with Zod
- Handle errors gracefully
- Use Prisma for all database operations
- Follow RESTful API conventions

### Frontend
- Use functional components with hooks
- Keep components small and focused
- Use TypeScript interfaces for props
- Follow React best practices

## Testing

### Backend Tests
```bash
cd packages/backend
npm test
```

### Dashboard Tests
```bash
cd packages/dashboard
npm test
```

### Mobile Tests
```bash
cd packages/mobile
npm test
```

## Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate and sanitize all user inputs
- Follow OWASP security guidelines
- Report security issues privately to maintainers

## Adding New Features

### Backend API Endpoints
1. Add route in `packages/backend/src/routes/`
2. Implement business logic in services
3. Add Prisma schema changes if needed
4. Update API documentation
5. Add tests

### Database Schema Changes
1. Update `packages/backend/prisma/schema.prisma`
2. Create migration: `npm run prisma:migrate`
3. Update seed script if needed
4. Document changes in pull request

### AI/ML Features
1. Document model/algorithm used
2. Consider performance implications
3. Handle API failures gracefully
4. Test with various inputs

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments to functions
- Include examples in API documentation
- Update architecture diagrams if needed

## Questions?

- Open an issue for discussion
- Tag maintainers for urgent matters
- Check existing issues and PRs first

Thank you for contributing to better healthcare technology! 🏥❤️
