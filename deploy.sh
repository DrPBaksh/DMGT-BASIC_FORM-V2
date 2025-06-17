#!/bin/bash

# DMGT Data & AI Readiness Assessment Form - Deployment Script
# Professional enterprise-grade deployment with comprehensive error handling

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
FRONTEND_ONLY=false
INFRASTRUCTURE_ONLY=false
AWS_REGION="eu-west-2"
STACK_NAME=""
S3_BUCKET_PREFIX=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 --environment <dev|prod> [options]"
    echo ""
    echo "Required:"
    echo "  --environment <env>    Environment to deploy (dev or prod)"
    echo ""
    echo "Options:"
    echo "  --frontend-only        Deploy only the frontend application"
    echo "  --infrastructure-only  Deploy only the AWS infrastructure"
    echo "  --region <region>      AWS region (default: us-east-1)"
    echo "  --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --environment dev"
    echo "  $0 --environment prod --region us-west-2"
    echo "  $0 --environment dev --frontend-only"
    echo "  $0 --environment prod --infrastructure-only"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --infrastructure-only)
            INFRASTRUCTURE_ONLY=true
            shift
            ;;
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$ENVIRONMENT" ]]; then
    print_error "Environment is required"
    show_usage
    exit 1
fi

if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    print_error "Environment must be 'dev' or 'prod'"
    exit 1
fi

# Set environment-specific variables
STACK_NAME="dmgt-assessment-form-$ENVIRONMENT"
S3_BUCKET_PREFIX="dmgt-assessment-$ENVIRONMENT"

print_status "🚀 Starting DMGT Assessment Form deployment"
print_status "Environment: $ENVIRONMENT"
print_status "Region: $AWS_REGION"
print_status "Stack Name: $STACK_NAME"

# Check if both frontend-only and infrastructure-only are set
if [[ "$FRONTEND_ONLY" == true && "$INFRASTRUCTURE_ONLY" == true ]]; then
    print_error "Cannot specify both --frontend-only and --infrastructure-only"
    exit 1
fi

# Check AWS CLI installation and configuration
# check_aws_cli() {
#     print_status "Checking AWS CLI configuration..."
    
#     if ! command -v aws &> /dev/null; then
#         print_error "AWS CLI is not installed. Please install AWS CLI first."
#         exit 1
#     fi
    
#     if ! aws sts get-caller-identity &> /dev/null; then
#         print_error "AWS CLI is not configured or credentials are invalid."
#         print_error "Please run 'aws configure' to set up your credentials."
#         exit 1
#     fi
    
#     print_success "AWS CLI is properly configured"
# }# Check Node.js and npm\ncheck_nodejs() {\n    print_status \"Checking Node.js and npm...\"\n    \n    if ! command -v node &> /dev/null; then\n        print_error \"Node.js is not installed. Please install Node.js 18+\"\n        exit 1\n    fi\n    \n    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)\n    if [[ $NODE_VERSION -lt 18 ]]; then\n        print_error \"Node.js version must be 18 or higher. Current version: $(node --version)\"\n        exit 1\n    fi\n    \n    if ! command -v npm &> /dev/null; then\n        print_error \"npm is not installed\"\n        exit 1\n    fi\n    \n    print_success \"Node.js $(node --version) and npm $(npm --version) are available\"\n}\n\n# Deploy AWS infrastructure\ndeploy_infrastructure() {\n    print_status \"📦 Deploying AWS infrastructure...\"\n    \n    # Check if CloudFormation template exists\n    if [[ ! -f \"infrastructure/cloudformation.yaml\" ]]; then\n        print_error \"CloudFormation template not found at infrastructure/cloudformation.yaml\"\n        exit 1\n    fi\n    \n    # Deploy CloudFormation stack\n    print_status \"Creating/updating CloudFormation stack: $STACK_NAME\"\n    \n    aws cloudformation deploy \\\n        --template-file infrastructure/cloudformation.yaml \\\n        --stack-name \"$STACK_NAME\" \\\n        --parameter-overrides \\\n            Environment=\"$ENVIRONMENT\" \\\n            BucketPrefix=\"$S3_BUCKET_PREFIX\" \\\n        --capabilities CAPABILITY_IAM \\\n        --region \"$AWS_REGION\" \\\n        --no-fail-on-empty-changeset\n    \n    if [[ $? -eq 0 ]]; then\n        print_success \"Infrastructure deployment completed\"\n    else\n        print_error \"Infrastructure deployment failed\"\n        exit 1\n    fi\n    \n    # Get stack outputs\n    print_status \"Retrieving stack outputs...\"\n    \n    WEBSITE_BUCKET=$(aws cloudformation describe-stacks \\\n        --stack-name \"$STACK_NAME\" \\\n        --region \"$AWS_REGION\" \\\n        --query \"Stacks[0].Outputs[?OutputKey=='WebsiteBucket'].OutputValue\" \\\n        --output text)\n    \n    CONFIG_BUCKET=$(aws cloudformation describe-stacks \\\n        --stack-name \"$STACK_NAME\" \\\n        --region \"$AWS_REGION\" \\\n        --query \"Stacks[0].Outputs[?OutputKey=='ConfigBucket'].OutputValue\" \\\n        --output text)\n    \n    CLOUDFRONT_DISTRIBUTION=$(aws cloudformation describe-stacks \\\n        --stack-name \"$STACK_NAME\" \\\n        --region \"$AWS_REGION\" \\\n        --query \"Stacks[0].Outputs[?OutputKey=='CloudFrontDistribution'].OutputValue\" \\\n        --output text)\n    \n    API_GATEWAY_URL=$(aws cloudformation describe-stacks \\\n        --stack-name \"$STACK_NAME\" \\\n        --region \"$AWS_REGION\" \\\n        --query \"Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue\" \\\n        --output text)\n    \n    print_success \"Website Bucket: $WEBSITE_BUCKET\"\n    print_success \"Config Bucket: $CONFIG_BUCKET\"\n    print_success \"CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION\"\n    print_success \"API Gateway URL: $API_GATEWAY_URL\"\n}\n\n# Upload sample configuration files\nupload_sample_configs() {\n    print_status \"📄 Uploading sample configuration files...\"\n    \n    if [[ -z \"$CONFIG_BUCKET\" ]]; then\n        print_error \"Config bucket name not available\"\n        exit 1\n    fi\n    \n    # Upload Company questions\n    if [[ -f \"data/Company.json\" ]]; then\n        aws s3 cp data/Company.json \"s3://$CONFIG_BUCKET/config/Company.json\" --region \"$AWS_REGION\"\n        print_success \"Uploaded Company.json\"\n    else\n        print_warning \"data/Company.json not found, skipping upload\"\n    fi\n    \n    # Upload Employee questions\n    if [[ -f \"data/Employee.json\" ]]; then\n        aws s3 cp data/Employee.json \"s3://$CONFIG_BUCKET/config/Employee.json\" --region \"$AWS_REGION\"\n        print_success \"Uploaded Employee.json\"\n    else\n        print_warning \"data/Employee.json not found, skipping upload\"\n    fi\n}\n\n# Build and deploy frontend\ndeploy_frontend() {\n    print_status \"🎨 Building and deploying frontend...\"\n    \n    # Navigate to frontend directory\n    if [[ ! -d \"frontend\" ]]; then\n        print_error \"Frontend directory not found\"\n        exit 1\n    fi\n    \n    cd frontend\n    \n    # Install dependencies\n    print_status \"Installing npm dependencies...\"\n    npm ci --silent\n    \n    # Create environment file\n    print_status \"Creating environment configuration...\"\n    \n    cat > .env.production << EOF\nREACT_APP_ENVIRONMENT=$ENVIRONMENT\nREACT_APP_API_URL=$API_GATEWAY_URL\nREACT_APP_AWS_REGION=$AWS_REGION\nEOF\n    \n    # Build the application\n    print_status \"Building React application...\"\n    npm run build\n    \n    if [[ $? -ne 0 ]]; then\n        print_error \"Frontend build failed\"\n        exit 1\n    fi\n    \n    print_success \"Frontend build completed\"\n    \n    # Upload to S3\n    print_status \"Uploading to S3...\"\n    \n    if [[ -z \"$WEBSITE_BUCKET\" ]]; then\n        print_error \"Website bucket name not available\"\n        exit 1\n    fi\n    \n    aws s3 sync build/ \"s3://$WEBSITE_BUCKET\" \\\n        --region \"$AWS_REGION\" \\\n        --delete \\\n        --cache-control \"public, max-age=31536000\" \\\n        --exclude \"*.html\" \\\n        --exclude \"service-worker.js\"\n    \n    # Upload HTML files with no-cache\n    aws s3 sync build/ \"s3://$WEBSITE_BUCKET\" \\\n        --region \"$AWS_REGION\" \\\n        --exclude \"*\" \\\n        --include \"*.html\" \\\n        --include \"service-worker.js\" \\\n        --cache-control \"no-cache, no-store, must-revalidate\"\n    \n    print_success \"Frontend uploaded to S3\"\n    \n    # Invalidate CloudFront cache\n    if [[ -n \"$CLOUDFRONT_DISTRIBUTION\" ]]; then\n        print_status \"Invalidating CloudFront cache...\"\n        \n        aws cloudfront create-invalidation \\\n            --distribution-id \"$CLOUDFRONT_DISTRIBUTION\" \\\n            --paths \"/*\" \\\n            --region \"$AWS_REGION\" > /dev/null\n        \n        print_success \"CloudFront cache invalidated\"\n    fi\n    \n    cd ..\n}\n\n# Get deployment URLs\nget_deployment_urls() {\n    print_status \"📋 Getting deployment information...\"\n    \n    CLOUDFRONT_URL=$(aws cloudformation describe-stacks \\\n        --stack-name \"$STACK_NAME\" \\\n        --region \"$AWS_REGION\" \\\n        --query \"Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue\" \\\n        --output text)\n    \n    S3_WEBSITE_URL=$(aws cloudformation describe-stacks \\\n        --stack-name \"$STACK_NAME\" \\\n        --region \"$AWS_REGION\" \\\n        --query \"Stacks[0].Outputs[?OutputKey=='WebsiteUrl'].OutputValue\" \\\n        --output text)\n    \n    echo \"\"\n    print_success \"🎉 Deployment completed successfully!\"\n    echo \"\"\n    echo \"📍 Access your application:\"\n    echo \"   CloudFront URL: $CLOUDFRONT_URL\"\n    echo \"   S3 Website URL: $S3_WEBSITE_URL\"\n    echo \"   API Gateway URL: $API_GATEWAY_URL\"\n    echo \"\"\n    echo \"🔧 Configuration:\"\n    echo \"   Environment: $ENVIRONMENT\"\n    echo \"   Region: $AWS_REGION\"\n    echo \"   Stack Name: $STACK_NAME\"\n    echo \"   Website Bucket: $WEBSITE_BUCKET\"\n    echo \"   Config Bucket: $CONFIG_BUCKET\"\n    echo \"\"\n    echo \"📝 Next steps:\"\n    echo \"   1. Access the application using the CloudFront URL\"\n    echo \"   2. Edit questions by modifying JSON files in the config bucket\"\n    echo \"   3. Monitor the application through AWS CloudWatch\"\n    echo \"\"\n}\n\n# Main deployment logic\nmain() {\n    # Pre-flight checks\n    check_aws_cli\n    \n    if [[ \"$INFRASTRUCTURE_ONLY\" == false ]]; then\n        check_nodejs\n    fi\n    \n    # Deploy based on options\n    if [[ \"$FRONTEND_ONLY\" == false ]]; then\n        deploy_infrastructure\n        upload_sample_configs\n    fi\n    \n    if [[ \"$INFRASTRUCTURE_ONLY\" == false ]]; then\n        # Get outputs if we didn't just deploy infrastructure\n        if [[ \"$FRONTEND_ONLY\" == true ]]; then\n            print_status \"Getting existing stack outputs...\"\n            \n            WEBSITE_BUCKET=$(aws cloudformation describe-stacks \\\n                --stack-name \"$STACK_NAME\" \\\n                --region \"$AWS_REGION\" \\\n                --query \"Stacks[0].Outputs[?OutputKey=='WebsiteBucket'].OutputValue\" \\\n                --output text)\n            \n            CLOUDFRONT_DISTRIBUTION=$(aws cloudformation describe-stacks \\\n                --stack-name \"$STACK_NAME\" \\\n                --region \"$AWS_REGION\" \\\n                --query \"Stacks[0].Outputs[?OutputKey=='CloudFrontDistribution'].OutputValue\" \\\n                --output text)\n            \n            API_GATEWAY_URL=$(aws cloudformation describe-stacks \\\n                --stack-name \"$STACK_NAME\" \\\n                --region \"$AWS_REGION\" \\\n                --query \"Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue\" \\\n                --output text)\n        fi\n        \n        deploy_frontend\n    fi\n    \n    # Show deployment information\n    if [[ \"$INFRASTRUCTURE_ONLY\" == false ]]; then\n        get_deployment_urls\n    else\n        print_success \"🎉 Infrastructure deployment completed!\"\n        echo \"\"\n        echo \"📝 Run the following to deploy the frontend:\"\n        echo \"   $0 --environment $ENVIRONMENT --frontend-only\"\n    fi\n}\n\n# Trap errors and cleanup\ntrap 'print_error \"Deployment failed! Check the output above for details.\"' ERR\n\n# Run main function\nmain\n\nprint_success \"✨ All done!\"\n