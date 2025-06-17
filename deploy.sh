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

# Default values - Updated to eu-west-2 as default
ENVIRONMENT=""
FRONTEND_ONLY=false
INFRASTRUCTURE_ONLY=false
AWS_REGION="eu-west-2"  # Changed from us-east-1 to eu-west-2
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
    echo "  --region <region>      AWS region (default: eu-west-2)"
    echo "  --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --environment dev"
    echo "  $0 --environment prod --region eu-west-2"
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
    
    print_success "AWS CLI is properly configured"
}

# Check Node.js and npm
check_nodejs() {
    print_status "Checking Node.js and npm..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        print_error "Node.js version must be 18 or higher. Current version: $(node --version)"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "Node.js $(node --version) and npm $(npm --version) are available"
}

# Check for changes in infrastructure
check_infrastructure_changes() {
    print_status "Checking for infrastructure changes..."
    
    # Get the hash of the CloudFormation template
    if [[ -f "infrastructure/cloudformation.yaml" ]]; then
        CURRENT_HASH=$(sha256sum infrastructure/cloudformation.yaml | cut -d' ' -f1)
        
        # Check if we have a previous hash stored
        HASH_FILE=".deploy-cache/infrastructure-hash-$ENVIRONMENT"
        if [[ -f "$HASH_FILE" ]]; then
            PREVIOUS_HASH=$(cat "$HASH_FILE")
            if [[ "$CURRENT_HASH" == "$PREVIOUS_HASH" ]]; then
                print_status "No infrastructure changes detected"
                return 1  # No changes
            fi
        fi
        
        print_status "Infrastructure changes detected"
        return 0  # Changes detected
    else
        print_error "CloudFormation template not found"
        exit 1
    fi
}

# Check for changes in frontend
check_frontend_changes() {
    print_status "Checking for frontend changes..."
    
    # Create a combined hash of relevant frontend files
    FRONTEND_HASH=""
    if [[ -d "frontend/src" ]]; then
        FRONTEND_HASH=$(find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.json" \) -exec sha256sum {} \; | sort | sha256sum | cut -d' ' -f1)
    fi
    
    if [[ -f "frontend/package.json" ]]; then
        PACKAGE_HASH=$(sha256sum frontend/package.json | cut -d' ' -f1)
        FRONTEND_HASH=$(echo "${FRONTEND_HASH}${PACKAGE_HASH}" | sha256sum | cut -d' ' -f1)
    fi
    
    # Check if we have a previous hash stored
    HASH_FILE=".deploy-cache/frontend-hash-$ENVIRONMENT"
    if [[ -f "$HASH_FILE" ]]; then
        PREVIOUS_HASH=$(cat "$HASH_FILE")
        if [[ "$FRONTEND_HASH" == "$PREVIOUS_HASH" ]]; then
            print_status "No frontend changes detected"
            return 1  # No changes
        fi
    fi
    
    print_status "Frontend changes detected"
    return 0  # Changes detected
}

# Save deployment hashes
save_deployment_hashes() {
    mkdir -p .deploy-cache
    
    # Save infrastructure hash
    if [[ -f "infrastructure/cloudformation.yaml" ]]; then
        sha256sum infrastructure/cloudformation.yaml | cut -d' ' -f1 > ".deploy-cache/infrastructure-hash-$ENVIRONMENT"
    fi
    
    # Save frontend hash
    FRONTEND_HASH=""
    if [[ -d "frontend/src" ]]; then
        FRONTEND_HASH=$(find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.json" \) -exec sha256sum {} \; | sort | sha256sum | cut -d' ' -f1)
    fi
    
    if [[ -f "frontend/package.json" ]]; then
        PACKAGE_HASH=$(sha256sum frontend/package.json | cut -d' ' -f1)
        FRONTEND_HASH=$(echo "${FRONTEND_HASH}${PACKAGE_HASH}" | sha256sum | cut -d' ' -f1)
    fi
    
    echo "$FRONTEND_HASH" > ".deploy-cache/frontend-hash-$ENVIRONMENT"
}

# Deploy AWS infrastructure
deploy_infrastructure() {
    print_status "📦 Deploying AWS infrastructure..."
    
    # Check if CloudFormation template exists
    if [[ ! -f "infrastructure/cloudformation.yaml" ]]; then
        print_error "CloudFormation template not found at infrastructure/cloudformation.yaml"
        exit 1
    fi
    
    # Deploy CloudFormation stack
    print_status "Creating/updating CloudFormation stack: $STACK_NAME"
    
    aws cloudformation deploy \
        --template-file infrastructure/cloudformation.yaml \
        --stack-name "$STACK_NAME" \
        --parameter-overrides \
            Environment="$ENVIRONMENT" \
            BucketPrefix="$S3_BUCKET_PREFIX" \
        --capabilities CAPABILITY_IAM \
        --region "$AWS_REGION" \
        --no-fail-on-empty-changeset
    
    if [[ $? -eq 0 ]]; then
        print_success "Infrastructure deployment completed"
    else
        print_error "Infrastructure deployment failed"
        exit 1
    fi
    
    # Get stack outputs and create .env file
    print_status "Retrieving stack outputs and creating .env file..."
    create_env_file
}

# Create dynamic .env file with stack outputs
create_env_file() {
    print_status "Creating dynamic .env file with API endpoints..."
    
    # Get stack outputs
    WEBSITE_BUCKET=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucket'].OutputValue" \
        --output text)
    
    CONFIG_BUCKET=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='ConfigBucket'].OutputValue" \
        --output text)
    
    CLOUDFRONT_DISTRIBUTION=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistribution'].OutputValue" \
        --output text)
    
    API_GATEWAY_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" \
        --output text)
    
    CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" \
        --output text)
    
    # Store these for later use
    export WEBSITE_BUCKET
    export CONFIG_BUCKET
    export CLOUDFRONT_DISTRIBUTION
    export API_GATEWAY_URL
    export CLOUDFRONT_URL
    
    print_success "Website Bucket: $WEBSITE_BUCKET"
    print_success "Config Bucket: $CONFIG_BUCKET"
    print_success "CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION"
    print_success "API Gateway URL: $API_GATEWAY_URL"
    print_success "CloudFront URL: $CLOUDFRONT_URL"
    
    # Create .env file for frontend
    cat > frontend/.env.production << EOF
REACT_APP_ENVIRONMENT=$ENVIRONMENT
REACT_APP_API_URL=$API_GATEWAY_URL
REACT_APP_AWS_REGION=$AWS_REGION
REACT_APP_CONFIG_BUCKET=$CONFIG_BUCKET
REACT_APP_CLOUDFRONT_URL=$CLOUDFRONT_URL
REACT_APP_WEBSITE_BUCKET=$WEBSITE_BUCKET
EOF
    
    print_success "Created frontend/.env.production with dynamic configuration"
}

# Upload sample configuration files
upload_sample_configs() {
    print_status "📄 Uploading sample configuration files..."
    
    if [[ -z "$CONFIG_BUCKET" ]]; then
        print_error "Config bucket name not available"
        exit 1
    fi
    
    # Upload Company questions
    if [[ -f "data/Company.json" ]]; then
        aws s3 cp data/Company.json "s3://$CONFIG_BUCKET/config/Company.json" --region "$AWS_REGION"
        print_success "Uploaded Company.json"
    else
        print_warning "data/Company.json not found, skipping upload"
    fi
    
    # Upload Employee questions
    if [[ -f "data/Employee.json" ]]; then
        aws s3 cp data/Employee.json "s3://$CONFIG_BUCKET/config/Employee.json" --region "$AWS_REGION"
        print_success "Uploaded Employee.json"
    else
        print_warning "data/Employee.json not found, skipping upload"
    fi
}

# Build and deploy frontend
deploy_frontend() {
    print_status "🎨 Building and deploying frontend..."
    
    # Navigate to frontend directory
    if [[ ! -d "frontend" ]]; then
        print_error "Frontend directory not found"
        exit 1
    fi
    
    cd frontend
    
    # Install dependencies
    print_status "Installing npm dependencies..."
    npm ci --silent
    
    # Build the application
    print_status "Building React application..."
    npm run build
    
    if [[ $? -ne 0 ]]; then
        print_error "Frontend build failed"
        exit 1
    fi
    
    print_success "Frontend build completed"
    
    # Upload to S3
    print_status "Uploading to S3..."
    
    if [[ -z "$WEBSITE_BUCKET" ]]; then
        print_error "Website bucket name not available"
        exit 1
    fi
    
    aws s3 sync build/ "s3://$WEBSITE_BUCKET" \
        --region "$AWS_REGION" \
        --delete \
        --cache-control "public, max-age=31536000" \
        --exclude "*.html" \
        --exclude "service-worker.js"
    
    # Upload HTML files with no-cache
    aws s3 sync build/ "s3://$WEBSITE_BUCKET" \
        --region "$AWS_REGION" \
        --exclude "*" \
        --include "*.html" \
        --include "service-worker.js" \
        --cache-control "no-cache, no-store, must-revalidate"
    
    print_success "Frontend uploaded to S3"
    
    # Invalidate CloudFront cache
    if [[ -n "$CLOUDFRONT_DISTRIBUTION" ]]; then
        print_status "Invalidating CloudFront cache..."
        
        aws cloudfront create-invalidation \
            --distribution-id "$CLOUDFRONT_DISTRIBUTION" \
            --paths "/*" \
            --region "$AWS_REGION" > /dev/null
        
        print_success "CloudFront cache invalidated"
    fi
    
    cd ..
}

# Get deployment URLs
get_deployment_urls() {
    print_status "📋 Getting deployment information..."
    
    if [[ -z "$CLOUDFRONT_URL" ]]; then
        CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION" \
            --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" \
            --output text)
    fi
    
    if [[ -z "$API_GATEWAY_URL" ]]; then
        API_GATEWAY_URL=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION" \
            --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" \
            --output text)
    fi
    
    S3_WEBSITE_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='WebsiteUrl'].OutputValue" \
        --output text)
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📍 Access your application:"
    echo "   CloudFront URL: $CLOUDFRONT_URL"
    echo "   S3 Website URL: $S3_WEBSITE_URL"
    echo "   API Gateway URL: $API_GATEWAY_URL"
    echo ""
    echo "🔧 Configuration:"
    echo "   Environment: $ENVIRONMENT"
    echo "   Region: $AWS_REGION"
    echo "   Stack Name: $STACK_NAME"
    echo "   Website Bucket: $WEBSITE_BUCKET"
    echo "   Config Bucket: $CONFIG_BUCKET"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Access the application using the CloudFront URL"
    echo "   2. Edit questions by modifying JSON files in the config bucket"
    echo "   3. Monitor the application through AWS CloudWatch"
    echo ""
}

# Main deployment logic
main() {
    # Pre-flight checks
    check_aws_cli
    
    if [[ "$INFRASTRUCTURE_ONLY" == false ]]; then
        check_nodejs
    fi
    
    # Determine what needs deployment based on changes
    DEPLOY_INFRASTRUCTURE=false
    DEPLOY_FRONTEND=false
    
    if [[ "$INFRASTRUCTURE_ONLY" == true ]]; then
        DEPLOY_INFRASTRUCTURE=true
    elif [[ "$FRONTEND_ONLY" == true ]]; then
        DEPLOY_FRONTEND=true
    else
        # Check for changes
        if check_infrastructure_changes; then
            DEPLOY_INFRASTRUCTURE=true
        fi
        
        if check_frontend_changes; then
            DEPLOY_FRONTEND=true
        fi
        
        # If no changes detected, ask user
        if [[ "$DEPLOY_INFRASTRUCTURE" == false && "$DEPLOY_FRONTEND" == false ]]; then
            print_warning "No changes detected. Deploy anyway? (y/n)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                DEPLOY_INFRASTRUCTURE=true
                DEPLOY_FRONTEND=true
            else
                print_status "Deployment skipped"
                return 0
            fi
        fi
    fi
    
    # Deploy based on what's needed
    if [[ "$DEPLOY_INFRASTRUCTURE" == true ]]; then
        deploy_infrastructure
        upload_sample_configs
    else
        # Get existing outputs if we're not deploying infrastructure
        create_env_file
    fi
    
    if [[ "$DEPLOY_FRONTEND" == true ]]; then
        deploy_frontend
    fi
    
    # Save deployment hashes
    save_deployment_hashes
    
    # Show deployment information
    if [[ "$INFRASTRUCTURE_ONLY" == false ]]; then
        get_deployment_urls
    else
        print_success "🎉 Infrastructure deployment completed!"
        echo ""
        echo "📝 Run the following to deploy the frontend:"
        echo "   $0 --environment $ENVIRONMENT --frontend-only"
    fi
}

# Trap errors and cleanup
trap 'print_error "Deployment failed! Check the output above for details."' ERR

# Run main function
main

print_success "✨ All done!"
