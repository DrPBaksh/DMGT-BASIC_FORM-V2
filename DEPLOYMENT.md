# DMGT Data & AI Readiness Assessment Form - Deployment Guide

## 🚀 Quick Start

Deploy your DMGT Assessment Platform in minutes with our automated deployment scripts.

### Prerequisites

Before you begin, ensure you have:

- **AWS CLI** configured with appropriate permissions
- **Node.js 18+** installed on your local machine
- **Bash shell** (Linux, macOS, or WSL on Windows)
- **AWS Account** with permissions to create:
  - S3 Buckets
  - Lambda Functions
  - API Gateway
  - CloudFront Distributions
  - IAM Roles

### One-Command Deployment

```bash
# Clone the repository
git clone https://github.com/DrPBaksh/DMGT-BASIC_FORM-V2.git
cd DMGT-BASIC_FORM-V2

# Make scripts executable
chmod +x deploy.sh destroy.sh

# Deploy to development environment
./deploy.sh --environment dev

# Deploy to production environment
./deploy.sh --environment prod
```

## 📋 Deployment Options

### Full Deployment
```bash
./deploy.sh --environment dev
```
Deploys both infrastructure and frontend application.

### Infrastructure Only
```bash
./deploy.sh --environment dev --infrastructure-only
```
Deploys only AWS resources (S3, Lambda, API Gateway, CloudFront).

### Frontend Only
```bash
./deploy.sh --environment dev --frontend-only
```
Builds and deploys only the React application (requires existing infrastructure).

### Custom Region
```bash
./deploy.sh --environment dev --region us-west-2
```
Deploy to a specific AWS region.

## 🏗️ Infrastructure Components

The deployment creates the following AWS resources:

### S3 Buckets
- **Website Bucket**: Hosts the React application
- **Config Bucket**: Stores editable question JSON files
- **Responses Bucket**: Stores assessment responses
- **Files Bucket**: Stores uploaded files organized by company/question

### Lambda Functions
- **Get Questions**: Retrieves questions from S3 config bucket
- **Save Response**: Saves assessment responses to S3
- **Get Response**: Retrieves existing responses for continuation
- **File Upload**: Handles file uploads with validation

### API Gateway
- REST API with CORS enabled
- Endpoints for questions, responses, and file operations
- Proper error handling and validation

### CloudFront Distribution
- Global CDN for fast content delivery
- Custom error pages for SPA routing
- Caching optimization for static assets

### IAM Roles
- Minimal permissions following security best practices
- Separate roles for different Lambda functions
- S3 access scoped to specific buckets

## 📁 File Structure After Deployment

```
S3 Buckets:
├── dmgt-assessment-website-{account}-{env}/
│   ├── static/                 # React build assets
│   ├── index.html             # Main application
│   └── manifest.json          # PWA manifest
├── dmgt-assessment-config-{account}-{env}/
│   └── config/
│       ├── Company.json       # Company questions (editable)
│       └── Employee.json      # Employee questions (editable)
├── dmgt-assessment-responses-{account}-{env}/
│   ├── company-responses/
│   │   └── {companyId}.json   # Company responses
│   └── employee-responses/
│       └── {companyId}/
│           └── {employeeId}.json  # Employee responses
└── dmgt-assessment-files-{account}-{env}/
    └── company-files/
        └── {companyId}/
            └── {questionId}/
                └── uploaded-files
```

## ⚙️ Configuration Management

### Environment Variables

The application supports the following environment variables:

```env
# API Configuration
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_AWS_REGION=us-east-1

# Environment
REACT_APP_ENVIRONMENT=dev|prod

# Feature Flags
REACT_APP_ENABLE_FILE_UPLOAD=true
REACT_APP_ENABLE_AUTO_SAVE=true
REACT_APP_MAX_FILE_SIZE=10485760

# Performance
REACT_APP_AUTO_SAVE_INTERVAL=30000
```

### Question Configuration

Questions are stored as JSON files in the config S3 bucket and can be edited directly:

1. Navigate to your config S3 bucket
2. Download `config/Company.json` or `config/Employee.json`
3. Edit the questions, validation rules, or add new questions
4. Upload the modified file back to S3
5. Changes are applied immediately (no redeploy needed)

## 🔧 Customization

### Adding New Question Types

1. Edit the question JSON files in S3
2. Update the TypeScript interfaces in `frontend/src/types/index.ts`
3. Create new question components in `frontend/src/components/questions/`
4. Update the form renderer to handle new types

### Styling Customization

The application uses CSS custom properties for easy theming:

```css
:root {
  --primary-blue: #007AFF;        /* Main brand color */
  --primary-blue-dark: #005cbf;   /* Darker variant */
  --primary-blue-light: #4da3ff;  /* Lighter variant */
  /* ... additional color variables */
}
```

### API Customization

Lambda functions can be modified to add:
- Additional validation logic
- Integration with external systems
- Custom analytics and reporting
- Advanced file processing

## 📊 Monitoring and Analytics

### CloudWatch Integration

The deployment automatically sets up:
- Lambda function logs
- API Gateway access logs
- S3 bucket notifications
- Custom metrics for form completion rates

### Performance Monitoring

Built-in performance tracking includes:
- Page load times
- Form completion rates
- File upload success rates
- API response times

## 🛡️ Security Features

### Data Protection
- All data encrypted at rest in S3
- HTTPS-only communication
- Proper CORS configuration
- Input validation and sanitization

### Access Control
- IAM roles with minimal permissions
- Company assessment restricted to one user per company
- Employee assessments isolated by company ID
- File upload validation and virus scanning ready

### Compliance Ready
- GDPR compliance features
- Data retention policies
- Audit logging
- Secure data deletion

## 🚨 Troubleshooting

### Common Issues

**Deployment Fails**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify permissions
aws iam list-attached-user-policies --user-name your-username
```

**CORS Errors**
- Check API Gateway CORS configuration
- Verify CloudFront cache settings
- Ensure S3 bucket CORS policy is correct

**Questions Not Loading**
- Verify config bucket contains question JSON files
- Check Lambda function logs in CloudWatch
- Confirm S3 bucket permissions

**File Upload Issues**
- Check file size limits (default 10MB)
- Verify file type restrictions
- Review Lambda timeout settings

### Debugging Commands

```bash
# View CloudFormation stack events
aws cloudformation describe-stack-events --stack-name dmgt-assessment-form-dev

# Check Lambda function logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/dmgt-assessment

# Test API endpoints
curl -X GET https://your-api-gateway-url/dev/questions/Company
```

## 🧹 Cleanup

### Complete Environment Destruction

```bash
# Destroy development environment
./destroy.sh --environment dev

# Destroy production environment (with confirmation)
./destroy.sh --environment prod

# Force destruction without prompts (dangerous)
./destroy.sh --environment dev --force
```

**⚠️ Warning**: The destroy script permanently deletes all data, including:
- Assessment responses
- Uploaded files
- Configuration customizations
- All AWS infrastructure

### Selective Cleanup

```bash
# Remove only the frontend
aws s3 rm s3://your-website-bucket --recursive

# Remove only responses (keep infrastructure)
aws s3 rm s3://your-responses-bucket --recursive
```

## 📞 Support

### Documentation
- API documentation available in the `/docs` folder (when implemented)
- Component documentation in individual React files
- Infrastructure documentation in CloudFormation comments

### Getting Help
- Check the Issues section of the GitHub repository
- Review CloudWatch logs for error details
- Consult AWS documentation for service-specific issues

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes with proper documentation
4. Test thoroughly in a development environment
5. Submit a pull request with detailed description

## 🔄 Updates and Maintenance

### Application Updates
```bash
# Pull latest changes
git pull origin main

# Deploy updates
./deploy.sh --environment dev --frontend-only
```

### Question Updates
- Edit JSON files directly in S3 config bucket
- No application restart required
- Changes take effect immediately

### Infrastructure Updates
```bash
# Update CloudFormation template
./deploy.sh --environment dev --infrastructure-only
```

---

**Built with enterprise security and scalability in mind**

For additional support or custom deployment requirements, please refer to the main README.md or contact the development team.