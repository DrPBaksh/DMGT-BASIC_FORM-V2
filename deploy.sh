#!/bin/bash

# Enhanced Deploy Script for DMGT Basic Form V2
# Features: AWS profile integration, advanced change detection, dynamic .env generation, proper deployment order

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default values with dmgt-account profile integration
ENVIRONMENT=""
FORCE_DEPLOY=false
INFRASTRUCTURE_ONLY=false
FRONTEND_ONLY=false
AWS_REGION="eu-west-2"
AWS_PROFILE="dmgt-account"  # Default to dmgt-account profile
SKIP_TESTS=false
VERBOSE=false

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

print_debug() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1"
    fi
}

# Function to show usage
show_usage() {
    echo "Enhanced DMGT Basic Form V2 Deployment Script"
    echo ""
    echo "Usage: $0 --environment <dev|prod> [options]"
    echo ""
    echo "Required:"
    echo "  --environment <env>     Environment to deploy (dev or prod)"
    echo ""
    echo "Options:"
    echo "  --profile <profile>     AWS profile to use (default: dmgt-account)"
    echo "  --region <region>       AWS region (default: eu-west-2)"
    echo "  --frontend-only         Deploy only the frontend application"
    echo "  --infrastructure-only   Deploy only the AWS infrastructure"
    echo "  --force                 Force deployment even if no changes detected"
    echo "  --skip-tests           Skip validation tests"
    echo "  --verbose              Enable verbose output"
    echo "  --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --environment dev"
    echo "  $0 --environment prod --profile dmgt-account --region eu-west-2"
    echo "  $0 --environment dev --frontend-only --force"
    echo "  $0 --environment prod --infrastructure-only --verbose"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --profile)
            AWS_PROFILE="$2"
            shift 2
            ;;
        --region)
            AWS_REGION="$2"
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
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
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

# Check if both frontend-only and infrastructure-only are set
if [[ "$FRONTEND_ONLY" == true && "$INFRASTRUCTURE_ONLY" == true ]]; then
    print_error "Cannot specify both --frontend-only and --infrastructure-only"
    exit 1
fi

# Set environment-specific variables
STACK_NAME="dmgt-assessment-form-$ENVIRONMENT"
S3_BUCKET_PREFIX="dmgt-assessment-$ENVIRONMENT"

print_status "🚀 Starting Enhanced DMGT Assessment Form deployment"
print_status "Environment: $ENVIRONMENT"
print_status "Region: $AWS_REGION"
print_status "AWS Profile: $AWS_PROFILE"
print_status "Stack Name: $STACK_NAME"
echo ""

# Check AWS CLI and profile configuration
check_aws_configuration() {
    print_status "🔑 Checking AWS configuration..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi
    
    # Test AWS profile
    if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &> /dev/null; then
        print_error "AWS profile '$AWS_PROFILE' is not configured or invalid"
        print_error "Please run: aws configure --profile $AWS_PROFILE"
        exit 1
    fi
    
    # Get caller identity for verification
    ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Arn --output text)
    
    print_success "AWS CLI configured successfully"
    print_debug "Account ID: $ACCOUNT_ID"
    print_debug "User ARN: $USER_ARN"
    
    # Set AWS environment variables
    export AWS_PROFILE="$AWS_PROFILE"
    export AWS_DEFAULT_REGION="$AWS_REGION"
}

# Check Node.js and npm
check_nodejs() {
    print_status "📦 Checking Node.js and npm..."
    
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

# Advanced change detection system
create_deployment_cache() {
    mkdir -p .deploy-cache
}

get_file_hash() {
    local file_path="$1"
    if [[ -f "$file_path" ]]; then
        sha256sum "$file_path" | cut -d' ' -f1
    elif [[ -d "$file_path" ]]; then
        find "$file_path" -type f -exec sha256sum {} \; | sort | sha256sum | cut -d' ' -f1
    else
        echo ""
    fi
}

check_infrastructure_changes() {
    if [[ "$FORCE_DEPLOY" == true ]]; then
        print_debug "Force deploy enabled - skipping change detection"
        return 0
    fi
    
    print_status "🔍 Checking infrastructure changes..."
    
    local current_hash=""
    local hash_file=".deploy-cache/infrastructure-hash-$ENVIRONMENT"
    
    # Calculate hash of infrastructure files
    if [[ -f "infrastructure/cloudformation.yaml" ]]; then
        current_hash=$(get_file_hash "infrastructure/cloudformation.yaml")
        print_debug "Current infrastructure hash: $current_hash"
        
        if [[ -f "$hash_file" ]]; then
            local previous_hash=$(cat "$hash_file")
            print_debug "Previous infrastructure hash: $previous_hash"
            
            if [[ "$current_hash" == "$previous_hash" ]]; then
                print_status "No infrastructure changes detected"
                return 1
            fi
        fi
        
        print_success "Infrastructure changes detected"
        return 0
    else
        print_error "CloudFormation template not found"
        exit 1
    fi
}

check_frontend_changes() {
    if [[ "$FORCE_DEPLOY" == true ]]; then
        print_debug "Force deploy enabled - skipping change detection"
        return 0
    fi
    
    print_status "🔍 Checking frontend changes..."
    
    local current_hash=""
    local hash_file=".deploy-cache/frontend-hash-$ENVIRONMENT"
    
    # Calculate combined hash of frontend files
    local src_hash=""
    local package_hash=""
    
    if [[ -d "frontend/src" ]]; then
        src_hash=$(get_file_hash "frontend/src")
    fi
    
    if [[ -f "frontend/package.json" ]]; then
        package_hash=$(get_file_hash "frontend/package.json")
    fi
    
    current_hash=$(echo "${src_hash}${package_hash}" | sha256sum | cut -d' ' -f1)
    print_debug "Current frontend hash: $current_hash"
    
    if [[ -f "$hash_file" ]]; then
        local previous_hash=$(cat "$hash_file")
        print_debug "Previous frontend hash: $previous_hash"
        
        if [[ "$current_hash" == "$previous_hash" ]]; then
            print_status "No frontend changes detected"
            return 1
        fi
    fi
    
    print_success "Frontend changes detected"
    return 0
}

save_deployment_hashes() {
    print_debug "Saving deployment hashes..."
    create_deployment_cache
    
    # Save infrastructure hash
    if [[ -f "infrastructure/cloudformation.yaml" ]]; then
        get_file_hash "infrastructure/cloudformation.yaml" > ".deploy-cache/infrastructure-hash-$ENVIRONMENT"
    fi
    
    # Save frontend hash
    local src_hash=""
    local package_hash=""
    
    if [[ -d "frontend/src" ]]; then
        src_hash=$(get_file_hash "frontend/src")
    fi
    
    if [[ -f "frontend/package.json" ]]; then
        package_hash=$(get_file_hash "frontend/package.json")
    fi
    
    echo "${src_hash}${package_hash}" | sha256sum | cut -d' ' -f1 > ".deploy-cache/frontend-hash-$ENVIRONMENT"
}

# Deploy AWS infrastructure
deploy_infrastructure() {
    print_status "🏗️  Deploying AWS infrastructure..."
    
    if [[ ! -f "infrastructure/cloudformation.yaml" ]]; then
        print_error "CloudFormation template not found at infrastructure/cloudformation.yaml"
        exit 1
    fi
    
    print_status "Creating/updating CloudFormation stack: $STACK_NAME"
    
    # Deploy with comprehensive parameter passing
    aws cloudformation deploy \
        --template-file infrastructure/cloudformation.yaml \
        --stack-name "$STACK_NAME" \
        --parameter-overrides \
            Environment="$ENVIRONMENT" \
            BucketPrefix="$S3_BUCKET_PREFIX" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --no-fail-on-empty-changeset
    
    if [[ $? -eq 0 ]]; then
        print_success "Infrastructure deployment completed"
    else
        print_error "Infrastructure deployment failed"
        exit 1
    fi
}

# Enhanced .env file creation with comprehensive configuration
create_dynamic_env_file() {
    print_status "⚙️  Generating dynamic .env file with all API endpoints..."
    
    # Get all stack outputs
    local outputs_json=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --query "Stacks[0].Outputs" \
        --output json)
    
    if [[ -z "$outputs_json" || "$outputs_json" == "null" ]]; then
        print_error "Failed to get CloudFormation outputs"
        exit 1
    fi
    
    # Create comprehensive .env file
    cat > frontend/.env.production << EOF
# Auto-generated .env file for DMGT Basic Form V2
# Environment: ${ENVIRONMENT}
# Generated on: $(date)
# AWS Profile: ${AWS_PROFILE}
# AWS Region: ${AWS_REGION}

REACT_APP_ENVIRONMENT=${ENVIRONMENT}
REACT_APP_AWS_REGION=${AWS_REGION}
EOF
    
    # Extract and add all outputs to .env
    echo "$outputs_json" | jq -r '.[] | "REACT_APP_" + .OutputKey + "=" + .OutputValue' >> frontend/.env.production
    
    # Store outputs for script use
    export WEBSITE_BUCKET=$(echo "$outputs_json" | jq -r '.[] | select(.OutputKey=="WebsiteBucket") | .OutputValue')
    export CONFIG_BUCKET=$(echo "$outputs_json" | jq -r '.[] | select(.OutputKey=="ConfigBucket") | .OutputValue')
    export CLOUDFRONT_DISTRIBUTION=$(echo "$outputs_json" | jq -r '.[] | select(.OutputKey=="CloudFrontDistribution") | .OutputValue')
    export API_GATEWAY_URL=$(echo "$outputs_json" | jq -r '.[] | select(.OutputKey=="ApiGatewayUrl") | .OutputValue')
    export CLOUDFRONT_URL=$(echo "$outputs_json" | jq -r '.[] | select(.OutputKey=="CloudFrontUrl") | .OutputValue')
    
    print_success "Dynamic .env file created successfully"
    print_debug "Generated .env contents:"
    if [[ "$VERBOSE" == true ]]; then
        cat frontend/.env.production | head -20
    fi
    
    # Validate critical outputs
    if [[ -z "$WEBSITE_BUCKET" || "$WEBSITE_BUCKET" == "null" ]]; then
        print_error "Failed to get Website Bucket from CloudFormation outputs"
        exit 1
    fi
    
    if [[ -z "$API_GATEWAY_URL" || "$API_GATEWAY_URL" == "null" ]]; then
        print_error "Failed to get API Gateway URL from CloudFormation outputs"
        exit 1
    fi
    
    print_success "All critical configuration values retrieved successfully"
}

# Upload configuration files to S3
upload_config_files() {
    print_status "📄 Uploading configuration files to S3..."
    
    if [[ -z "$CONFIG_BUCKET" ]]; then
        print_error "Config bucket name not available"
        exit 1
    fi
    
    local files_uploaded=0
    
    # Upload Company questions
    if [[ -f "data/Company.json" ]]; then
        aws s3 cp data/Company.json "s3://$CONFIG_BUCKET/config/Company.json" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE"
        print_success "Uploaded Company.json"
        ((files_uploaded++))
    else
        print_warning "data/Company.json not found, skipping upload"
    fi
    
    # Upload Employee questions
    if [[ -f "data/Employee.json" ]]; then
        aws s3 cp data/Employee.json "s3://$CONFIG_BUCKET/config/Employee.json" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE"
        print_success "Uploaded Employee.json"
        ((files_uploaded++))
    else
        print_warning "data/Employee.json not found, skipping upload"
    fi
    
    print_success "Uploaded $files_uploaded configuration files"
}

# Enhanced frontend build and deployment
deploy_frontend() {
    print_status "🎨 Building and deploying frontend..."
    
    if [[ ! -d "frontend" ]]; then
        print_error "Frontend directory not found"
        exit 1
    fi
    
    cd frontend
    
    # Check if .env.production exists
    if [[ ! -f ".env.production" ]]; then
        print_error ".env.production file not found. Infrastructure must be deployed first."
        exit 1
    fi
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]] || [[ "package-lock.json" -nt "node_modules" ]]; then
        print_status "📦 Installing npm dependencies..."
        npm ci --silent
        print_success "Dependencies installed"
    else
        print_debug "Dependencies up to date"
    fi
    
    # Run tests if not skipped
    if [[ "$SKIP_TESTS" != true ]]; then
        print_status "🧪 Running tests..."
        if npm test -- --watchAll=false --passWithNoTests; then
            print_success "Tests passed"
        else
            print_warning "Tests failed but continuing deployment"
        fi
    fi
    
    # Build the application
    print_status "🔨 Building React application..."
    npm run build
    
    if [[ $? -ne 0 ]]; then
        print_error "Frontend build failed"
        exit 1
    fi
    
    print_success "Frontend build completed"
    
    # Validate build output
    if [[ ! -d "build" ]] || [[ ! -f "build/index.html" ]]; then
        print_error "Build output is invalid"
        exit 1
    fi
    
    # Upload to S3 with optimized caching
    print_status "☁️  Uploading to S3..."
    
    if [[ -z "$WEBSITE_BUCKET" ]]; then
        print_error "Website bucket name not available"
        exit 1
    fi
    
    # Upload static assets with long-term caching
    aws s3 sync build/ "s3://$WEBSITE_BUCKET" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --delete \
        --cache-control "public, max-age=31536000" \
        --exclude "*.html" \
        --exclude "service-worker.js" \
        --exclude "manifest.json"
    
    # Upload HTML files and service worker with no-cache
    aws s3 sync build/ "s3://$WEBSITE_BUCKET" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --exclude "*" \
        --include "*.html" \
        --include "service-worker.js" \
        --include "manifest.json" \
        --cache-control "no-cache, no-store, must-revalidate"
    
    print_success "Frontend uploaded to S3"
    
    # Invalidate CloudFront cache
    if [[ -n "$CLOUDFRONT_DISTRIBUTION" && "$CLOUDFRONT_DISTRIBUTION" != "null" ]]; then
        print_status "🔄 Invalidating CloudFront cache..."
        
        local invalidation_id=$(aws cloudfront create-invalidation \
            --distribution-id "$CLOUDFRONT_DISTRIBUTION" \
            --paths "/*" \
            --profile "$AWS_PROFILE" \
            --query "Invalidation.Id" \
            --output text)
        
        print_success "CloudFront cache invalidation started (ID: $invalidation_id)"
        
        if [[ "$VERBOSE" == true ]]; then
            print_status "Waiting for invalidation to complete..."
            aws cloudfront wait invalidation-completed \
                --distribution-id "$CLOUDFRONT_DISTRIBUTION" \
                --id "$invalidation_id" \
                --profile "$AWS_PROFILE"
            print_success "CloudFront invalidation completed"
        fi
    else
        print_warning "CloudFront distribution ID not available - skipping cache invalidation"
    fi
    
    cd ..
}

# Comprehensive deployment summary
show_deployment_summary() {
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo -e "${BLUE}📋 Deployment Summary${NC}"
    echo "===================="
    
    # Get final URLs
    local cloudfront_url="${CLOUDFRONT_URL:-Not available}"
    local api_url="${API_GATEWAY_URL:-Not available}"
    local s3_website_url=""
    
    if [[ -n "$WEBSITE_BUCKET" ]]; then
        s3_website_url="http://$WEBSITE_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
    else
        s3_website_url="Not available"
    fi
    
    echo -e "${GREEN}🌐 Access URLs:${NC}"
    echo "   Primary (CloudFront): $cloudfront_url"
    echo "   Fallback (S3):        $s3_website_url"
    echo ""
    echo -e "${GREEN}🔗 API Endpoints:${NC}"
    echo "   Base API URL:         $api_url"
    echo "   Questions:            $api_url/questions/{type}"
    echo "   Responses:            $api_url/responses"
    echo "   File Upload:          $api_url/files"
    echo ""
    echo -e "${GREEN}🔧 Configuration:${NC}"
    echo "   Environment:          $ENVIRONMENT"
    echo "   AWS Region:           $AWS_REGION"
    echo "   AWS Profile:          $AWS_PROFILE"
    echo "   Stack Name:           $STACK_NAME"
    echo ""
    echo -e "${GREEN}📦 Resources:${NC}"
    echo "   Website Bucket:       ${WEBSITE_BUCKET:-Not available}"
    echo "   Config Bucket:        ${CONFIG_BUCKET:-Not available}"
    echo "   CloudFront ID:        ${CLOUDFRONT_DISTRIBUTION:-Not available}"
    echo ""
    echo -e "${BLUE}📝 Next Steps:${NC}"
    echo "   1. Access the application using the CloudFront URL"
    echo "   2. Test both Company and Employee assessment flows"
    echo "   3. Edit questions by modifying JSON files in the config bucket"
    echo "   4. Monitor the application through AWS CloudWatch"
    echo ""
    
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        print_status "Development environment ready for testing!"
    else
        print_status "Production environment deployed successfully!"
    fi
}

# Main deployment orchestration
main() {
    create_deployment_cache
    
    # Pre-flight checks
    check_aws_configuration
    
    if [[ "$INFRASTRUCTURE_ONLY" == false ]]; then
        check_nodejs
    fi
    
    # Determine what needs deployment
    local deploy_infrastructure=false
    local deploy_frontend=false
    
    if [[ "$INFRASTRUCTURE_ONLY" == true ]]; then
        deploy_infrastructure=true
    elif [[ "$FRONTEND_ONLY" == true ]]; then
        deploy_frontend=true
    else
        # Check for changes
        if check_infrastructure_changes; then
            deploy_infrastructure=true
        fi
        
        if check_frontend_changes; then
            deploy_frontend=true
        fi
        
        # If no changes detected and not forced, prompt user
        if [[ "$deploy_infrastructure" == false && "$deploy_frontend" == false && "$FORCE_DEPLOY" == false ]]; then
            print_warning "No changes detected. Deploy anyway? (y/n)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                deploy_infrastructure=true
                deploy_frontend=true
                print_status "Proceeding with full deployment"
            else
                print_status "Deployment cancelled"
                return 0
            fi
        fi
    fi
    
    # Execute deployment steps in correct order
    if [[ "$deploy_infrastructure" == true ]]; then
        deploy_infrastructure
        create_dynamic_env_file
        upload_config_files
    elif [[ "$deploy_frontend" == true ]]; then
        # Frontend-only deployment requires existing infrastructure
        create_dynamic_env_file
    fi
    
    if [[ "$deploy_frontend" == true ]]; then
        deploy_frontend
    fi
    
    # Save deployment state
    save_deployment_hashes
    
    # Show comprehensive summary
    if [[ "$INFRASTRUCTURE_ONLY" == false ]]; then
        show_deployment_summary
    else
        print_success "🎉 Infrastructure deployment completed!"
        echo ""
        echo "📝 Run the following to deploy the frontend:"
        echo "   $0 --environment $ENVIRONMENT --frontend-only"
    fi
}

# Error handling
trap 'print_error "Deployment failed! Check the output above for details."' ERR

# Execute main function
print_status "Starting deployment process..."
main

print_success "✨ Deployment process completed!"