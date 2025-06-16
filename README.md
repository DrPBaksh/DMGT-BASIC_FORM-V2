# DMGT Data & AI Readiness Assessment Form

A professional, enterprise-grade React application for evaluating organizational data and AI readiness through comprehensive assessments.

## 🚀 Features

- **Dual Assessment Types**: Company-wide organizational assessment and individual employee assessments
- **Dynamic Question Management**: Questions stored as editable JSON files in S3
- **Advanced File Upload**: Question-level file attachments with organized storage
- **Save & Reload System**: Multi-session support with auto-save and manual save options
- **Premium UI/UX**: Exceptional design with blue (#007AFF) and white theme
- **AWS Infrastructure**: Fully deployed on AWS with CloudFormation
- **CORS-Free Architecture**: Properly configured for seamless operation

## 📋 Question Categories

### Company Assessment
- High-level organizational questions (strategy, infrastructure, governance)
- **One person per company only**
- Focuses on enterprise-wide capabilities and readiness

### Employee Assessment
- Individual role-specific questions (skills, tools, processes)
- **Multiple employees per company allowed**
- Personalized assessment based on individual roles

## 🏗️ Architecture

### Frontend
- React 18+ with TypeScript
- Modern hooks and state management
- Mobile-first responsive design
- Inter font with expert typography
- Masterful use of whitespace and visual hierarchy

### Backend (AWS)
- **S3 Buckets**: Website hosting, config, responses, and file storage
- **Lambda Functions**: API handlers for form operations
- **API Gateway**: REST endpoints with proper CORS
- **CloudFront**: CDN distribution
- **IAM Roles**: Minimal security permissions

### File Organization
```
📁 S3 Bucket Structure
├── config/
│   ├── Company.json      # Company assessment questions
│   └── Employee.json     # Employee assessment questions
├── company-responses/
│   └── {companyId}.json  # Company assessment responses
├── employee-responses/
│   └── {companyId}/
│       └── {employeeId}.json  # Employee responses
└── company-files/
    └── {companyId}/
        └── {questionId}/
            └── filename.ext   # Uploaded files
```

## 🛠️ Quick Start

### Prerequisites
- AWS CLI configured
- Node.js 18+
- Bash shell

### Deployment
```bash
# Deploy to development environment
./deploy.sh --environment dev

# Deploy to production environment
./deploy.sh --environment prod

# Deploy only infrastructure
./deploy.sh --environment dev --infrastructure-only

# Deploy only frontend
./deploy.sh --environment dev --frontend-only
```

### Cleanup
```bash
# Destroy development environment
./destroy.sh --environment dev

# Destroy production environment
./destroy.sh --environment prod
```

## 📝 Question Management

Questions are dynamically loaded from S3 JSON files. To modify questions:

1. Navigate to your S3 config bucket
2. Edit `Company.json` or `Employee.json`
3. Upload the modified file
4. Refresh the application - changes are loaded automatically

### Question Types Supported
- Text input
- Textarea
- Multiple choice (radio/checkbox)
- File upload
- Rating scales
- Dropdown selects

### Example Question Structure
```json
{
  "id": "q1",
  "type": "text",
  "title": "What is your company's primary industry?",
  "required": true,
  "validation": {
    "minLength": 2,
    "maxLength": 100
  }
}
```

## 💾 Save & Reload System

- **Auto-Save**: Automatic progress saving every 30 seconds
- **Manual Save**: Explicit "Save Progress" button
- **Session Restoration**: Resume exactly where you left off
- **Progress Tracking**: Visual completion percentage
- **Multi-User Support**: Separate sessions for different employees

## 📁 File Upload Features

- **Question-Level Uploads**: Any question can be configured for file attachments
- **Drag & Drop Interface**: Intuitive upload experience
- **File Type Validation**: Configurable file type restrictions
- **Progress Indicators**: Real-time upload progress
- **File Management**: View, replace, and download uploaded files
- **Organized Storage**: Files automatically organized by company and question

## 🎨 Design Philosophy

### Color Theme
- **Primary**: Blue (#007AFF)
- **Base**: Clean white backgrounds
- **Accents**: Subtle grays and premium touches

### Design Principles
- **Space Utilization**: Masterful use of whitespace and golden ratio principles
- **Typography**: Inter font with expert hierarchy
- **Micro-Interactions**: Smooth animations and delightful hover states
- **Card-Based Layouts**: Elegant borders and depth
- **Mobile-First**: Exceptional experience on all devices

## 🔒 Security Features

- **IAM Roles**: Minimal permissions principle
- **CORS Configuration**: Properly configured across all services
- **File Validation**: Secure file upload validation
- **No Hardcoded Credentials**: Environment-based configuration
- **Access Control**: Company assessment restricted to one user per company

## 📊 Data Flow

1. **Questions**: Loaded dynamically from S3 JSON files
2. **Responses**: Saved to organized S3 structure
3. **Files**: Uploaded to dedicated S3 paths
4. **Progress**: Automatically saved and restorable
5. **Access Control**: Enforced at application and infrastructure level

## 🚀 Performance Optimizations

- **CloudFront CDN**: Fast global content delivery
- **Efficient S3 Operations**: Optimized read/write patterns
- **Progressive Loading**: Questions loaded as needed
- **Caching Strategy**: Smart caching for better performance
- **Optimized Builds**: Production-ready webpack optimization

## 📚 Technical Specifications

### Frontend Stack
- React 18+
- TypeScript
- Modern CSS with expert styling
- Responsive design principles
- Premium animations and interactions

### Backend Stack
- Python Lambda functions
- boto3 for S3 operations
- API Gateway for REST endpoints
- CloudFormation for infrastructure

### Build Tools
- npm/webpack
- Optimized production builds
- Source maps for debugging
- Hot reloading for development

## 🎯 Success Criteria

✅ Single command deployment  
✅ Zero CORS errors  
✅ Dynamic question loading from S3  
✅ Seamless file upload functionality  
✅ Perfect save/reload across sessions  
✅ Multi-user support with access controls  
✅ Exceptional visual design  
✅ Professional corporate appearance  
✅ Complete environment cleanup  

## 📞 Support

For questions, issues, or contributions, please refer to the documentation in each module directory or create an issue in this repository.

---

**Built with ❤️ for enterprise-grade data and AI readiness assessment**