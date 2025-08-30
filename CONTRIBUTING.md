# Contributing to Stock Inventory Management System

Thank you for considering contributing to this project! We welcome contributions from the community.

## How to Contribute

### Reporting Issues
- Use the GitHub issue tracker to report bugs
- Include detailed information about the problem
- Provide steps to reproduce the issue
- Include screenshots if relevant

### Feature Requests
- Open an issue to discuss new features
- Explain the use case and benefits
- Consider the impact on existing functionality

### Code Contributions

#### Getting Started
1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature
4. Set up the development environment

#### Development Setup
```bash
# Clone your fork
git clone https://github.com/yourusername/stock-inventory-management.git
cd stock-inventory-management

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements-github.txt

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Run the application
python main.py
```

#### Coding Standards
- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comments for complex logic
- Write docstrings for functions and classes
- Keep functions small and focused

#### Frontend Guidelines
- Use semantic HTML
- Follow BEM methodology for CSS classes
- Keep JavaScript modular
- Test on multiple browsers
- Ensure mobile responsiveness

#### Database Changes
- Use SQLAlchemy migrations for schema changes
- Test migrations both up and down
- Consider data migration needs
- Document schema changes

#### Testing
- Test your changes thoroughly
- Include unit tests for new functionality
- Test on different browsers and devices
- Verify GST calculations are correct

#### Pull Request Process
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Submit pull request with clear description

#### Pull Request Guidelines
- Use descriptive commit messages
- Keep changes focused and atomic
- Include tests for new features
- Update README if needed
- Reference related issues

## Code Review Process

- All submissions require review
- Reviews focus on code quality and functionality
- Feedback should be constructive
- Authors should respond to review comments

## Development Guidelines

### Backend Development
- Use Flask best practices
- Follow SQLAlchemy patterns
- Handle errors gracefully
- Log important events
- Validate all inputs

### Frontend Development
- Maintain responsive design
- Use progressive enhancement
- Keep JavaScript unobtrusive
- Optimize for performance
- Test accessibility

### Security Considerations
- Never commit secrets or credentials
- Validate and sanitize all inputs
- Use parameterized queries
- Implement proper authentication
- Follow OWASP guidelines

## Indian Business Context

This application is designed for Indian businesses, so contributors should:
- Understand GST requirements
- Use Indian number formatting
- Consider local business practices
- Test with Indian data
- Respect cultural considerations

## Getting Help

- Join discussions in GitHub issues
- Ask questions in pull requests
- Check existing documentation
- Review the codebase for examples

## Recognition

Contributors will be:
- Listed in the README acknowledgments
- Mentioned in release notes
- Recognized for significant contributions

Thank you for helping make this project better!