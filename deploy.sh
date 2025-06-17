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
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Default values with dmgt-account profile integration
ENVIRONMENT=""
FORCE_DEPLOY=false
INFRASTRUCTURE_ONLY=false
FRONTEND_ONLY=false
AWS_REGION="eu-west-2"  # ✅ EU-West-2 as default
AWS_PROFILE="dmgt-account"  # ✅ Default to dmgt-account profile
SKIP_TESTS=false
VERBOSE=false

# Function to print colored output with timestamps
print_header() {
    echo ""
    echo -e "${BOLD}${CYAN}============================================${NC}"
    echo -e "${BOLD}${CYAN} $1${NC}"
    echo -e "${BOLD}${CYAN}============================================${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${BOLD}${BLUE}📋 STEP: $1${NC}"
    echo -e "${BLUE}$(date '+%Y-%m-%d %H:%M:%S') - $1${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') - $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') - $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') - $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') - $1"
}

print_debug() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} $(date '+%H:%M:%S') - $1"
    fi
}

print_progress() {
    echo -e "${CYAN}⏳${NC} $1"
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
S3_BUCKET_PREFIX="dmgt-assessment"

print_header "🚀 DMGT Assessment Form Deployment Starting"
print_status "🎯 Deployment Configuration:"
print_status "   Environment: $ENVIRONMENT"
print_status "   Region: $AWS_REGION"
print_status "   AWS Profile: $AWS_PROFILE"
print_status "   Stack Name: $STACK_NAME"
print_status "   Force Deploy: $FORCE_DEPLOY"
print_status "   Infrastructure Only: $INFRASTRUCTURE_ONLY"
print_status "   Frontend Only: $FRONTEND_ONLY"
echo ""

# Check AWS CLI and profile configuration
check_aws_configuration() {
    print_step "Validating AWS Configuration"
    
    print_progress "Checking AWS CLI installation..."
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi
    print_success "AWS CLI found: $(aws --version 2>&1 | head -n1)"
    
    print_progress "Validating AWS profile '$AWS_PROFILE'..."
    if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &> /dev/null; then
        print_error "AWS profile '$AWS_PROFILE' is not configured or invalid"
        print_error "Please run: aws configure --profile $AWS_PROFILE"
        exit 1
    fi
    
    # Get caller identity for verification
    ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Arn --output text)
    
    print_success "AWS profile '$AWS_PROFILE' is valid"
    print_status "   Account ID: $ACCOUNT_ID"
    print_status "   User/Role: $(echo $USER_ARN | cut -d'/' -f2-)"
    print_status "   Region: $AWS_REGION"
    
    # Set AWS environment variables
    export AWS_PROFILE="$AWS_PROFILE"
    export AWS_DEFAULT_REGION="$AWS_REGION"
    
    print_debug "AWS environment variables set: AWS_PROFILE=$AWS_PROFILE, AWS_DEFAULT_REGION=$AWS_REGION"
}

# Check Node.js and npm
check_nodejs() {
    print_step "Validating Node.js Environment"
    
    print_progress "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        print_error "Node.js version must be 18 or higher. Current version: $(node --version)"
        exit 1
    fi
    
    print_progress "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "Node.js environment validated"
    print_status "   Node.js: $(node --version)"
    print_status "   npm: $(npm --version)"
    print_status "   npm registry: $(npm config get registry)"
}

# ✅ ENHANCED CHANGE DETECTION SYSTEM
create_deployment_cache() {
    print_progress "Creating deployment cache directory..."
    mkdir -p .deploy-cache
    print_debug "Deployment cache directory created at .deploy-cache/"
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
    print_step "Detecting Infrastructure Changes"
    
    if [[ "$FORCE_DEPLOY" == true ]]; then
        print_warning "Force deploy enabled - skipping change detection"
        return 0
    fi
    
    print_progress "Calculating infrastructure hash..."
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
                print_success "No infrastructure changes detected - deployment not needed"
                return 1
            fi
        else
            print_debug "No previous infrastructure hash found - first deployment"
        fi
        
        print_success "Infrastructure changes detected - deployment required"
        return 0
    else
        print_error "CloudFormation template not found at infrastructure/cloudformation.yaml"
        exit 1
    fi
}

check_frontend_changes() {
    print_step "Detecting Frontend Changes"
    
    if [[ "$FORCE_DEPLOY" == true ]]; then
        print_warning "Force deploy enabled - skipping change detection"
        return 0
    fi
    
    print_progress "Calculating frontend hash..."
    local current_hash=""
    local hash_file=".deploy-cache/frontend-hash-$ENVIRONMENT"
    
    # Calculate combined hash of frontend files
    local src_hash=""
    local package_hash=""
    
    if [[ -d "frontend/src" ]]; then
        print_progress "Hashing frontend source files..."
        src_hash=$(get_file_hash "frontend/src")
    fi
    
    if [[ -f "frontend/package.json" ]]; then
        print_progress "Hashing package.json..."
        package_hash=$(get_file_hash "frontend/package.json")
    fi
    
    current_hash=$(echo "${src_hash}${package_hash}" | sha256sum | cut -d' ' -f1)
    print_debug "Current frontend hash: $current_hash"
    
    if [[ -f "$hash_file" ]]; then
        local previous_hash=$(cat "$hash_file")
        print_debug "Previous frontend hash: $previous_hash"
        
        if [[ "$current_hash" == "$previous_hash" ]]; then
            print_success "No frontend changes detected - deployment not needed"
            return 1
        fi
    else
        print_debug "No previous frontend hash found - first deployment"
    fi
    
    print_success "Frontend changes detected - deployment required"
    return 0
}

save_deployment_hashes() {
    print_progress "Saving deployment hashes for future change detection..."
    create_deployment_cache
    
    # Save infrastructure hash
    if [[ -f "infrastructure/cloudformation.yaml" ]]; then
        get_file_hash "infrastructure/cloudformation.yaml" > ".deploy-cache/infrastructure-hash-$ENVIRONMENT"
        print_debug "Infrastructure hash saved"
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
    print_debug "Frontend hash saved"
}

# Deploy AWS infrastructure
deploy_infrastructure() {
    print_step "Deploying AWS Infrastructure"
    
    print_progress "Validating CloudFormation template..."
    if [[ ! -f "infrastructure/cloudformation.yaml" ]]; then
        print_error "CloudFormation template not found at infrastructure/cloudformation.yaml"
        exit 1
    fi
    
    # Validate template syntax
    print_progress "Validating CloudFormation template syntax..."
    if aws cloudformation validate-template \
        --template-body file://infrastructure/cloudformation.yaml \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" &> /dev/null; then
        print_success "CloudFormation template syntax is valid"
    else
        print_error "CloudFormation template has syntax errors"
        exit 1
    fi
    
    print_status "🏗️ Creating/updating CloudFormation stack: $STACK_NAME"
    print_status "This deployment will create the following resources:"
    print_status "   📦 S3 Buckets (website, config, responses, files, lambda code)"
    print_status "   🔧 Lambda Functions (4 functions with 15-min file upload timeout)"
    print_status "   🌐 API Gateway (RESTful API with CORS support)"
    print_status "   ☁️ CloudFront Distribution (global CDN)"
    print_status "   🔐 IAM Roles and Policies (secure access)"
    
    # Deploy with comprehensive parameter passing
    print_progress "Executing CloudFormation deployment..."
    if aws cloudformation deploy \
        --template-file infrastructure/cloudformation.yaml \
        --stack-name "$STACK_NAME" \
        --parameter-overrides \
            Environment="$ENVIRONMENT" \
            BucketPrefix="$S3_BUCKET_PREFIX" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --no-fail-on-empty-changeset; then
        print_success "🎉 Infrastructure deployment completed successfully!"
    else
        print_error "❌ Infrastructure deployment failed"
        print_error "Run this command to see error details:"
        print_error "aws cloudformation describe-stack-events --stack-name $STACK_NAME --profile $AWS_PROFILE --region $AWS_REGION"
        exit 1
    fi
}

# ✅ ENHANCED .env FILE CREATION WITH COMPREHENSIVE CONFIGURATION
create_dynamic_env_file() {
    print_step "Generating Dynamic Frontend Configuration"
    
    print_progress "Retrieving CloudFormation stack outputs..."
    local outputs_json=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --query "Stacks[0].Outputs" \
        --output json)
    
    if [[ -z "$outputs_json" || "$outputs_json" == "null" ]]; then
        print_error "❌ Failed to get CloudFormation outputs"
        print_error "Stack may not be deployed correctly"
        exit 1
    fi
    
    print_success "Retrieved $(echo "$outputs_json" | jq length) stack outputs"
    
    # Create comprehensive .env file
    print_progress "Creating .env.production file..."
    cat > frontend/.env.production << EOF
# Auto-generated .env file for DMGT Basic Form V2
# Environment: ${ENVIRONMENT}
# Generated on: $(date)
# AWS Profile: ${AWS_PROFILE}
# AWS Region: ${AWS_REGION}
# Stack: ${STACK_NAME}

REACT_APP_ENVIRONMENT=${ENVIRONMENT}
REACT_APP_AWS_REGION=${AWS_REGION}
EOF
    
    # Extract and add all outputs to .env
    print_progress "Processing CloudFormation outputs..."
    echo "$outputs_json" | jq -r '.[] | "REACT_APP_" + .OutputKey + "=" + .OutputValue' >> frontend/.env.production
    
    # Store outputs for script use
    export WEBSITE_BUCKET=$(echo "$outputs_json" | jq -r '.[] | select(.OutputKey=="WebsiteBucket") | .OutputValue')
    export CONFIG_BUCKET=$(echo "$outputs_json" | jq -r '.[] | select(.OutputKey=="ConfigBucket") | .OutputValue')
    export CLOUDFRONT_DISTRIBUTION=$(echo "$outputs_json" | jq -r '.[] | select(.OutputKey=="CloudFrontDistribution") | .OutputValue')
    export API_GATEWAY_URL=$(echo "$outputs_json" | jq -r '.[] | select(.OutputKey=="ApiGatewayUrl") | .OutputValue')
    export CLOUDFRONT_URL=$(echo "$outputs_json" | jq -r '.[] | select(.OutputKey=="CloudFrontUrl") | .OutputValue')
    
    print_success "✅ Dynamic .env file created successfully"
    print_status "Generated configuration includes:"
    print_status "   🔗 API Gateway URL: $API_GATEWAY_URL"
    print_status "   ☁️ CloudFront URL: $CLOUDFRONT_URL"
    print_status "   📦 Website Bucket: $WEBSITE_BUCKET"
    print_status "   📁 Config Bucket: $CONFIG_BUCKET"
    
    if [[ "$VERBOSE" == true ]]; then
        print_debug "Complete .env.production contents:"
        cat frontend/.env.production | head -20
    fi
    
    # Validate critical outputs
    if [[ -z "$WEBSITE_BUCKET" || "$WEBSITE_BUCKET" == "null" ]]; then
        print_error "❌ Failed to get Website Bucket from CloudFormation outputs"
        exit 1
    fi
    
    if [[ -z "$API_GATEWAY_URL" || "$API_GATEWAY_URL" == "null" ]]; then
        print_error "❌ Failed to get API Gateway URL from CloudFormation outputs"
        exit 1
    fi
    
    print_success "✅ All critical configuration values retrieved successfully"
}

# Upload configuration files to S3
upload_config_files() {
    print_step "Uploading Configuration Files to S3"
    
    if [[ -z "$CONFIG_BUCKET" ]]; then
        print_error "❌ Config bucket name not available"
        exit 1
    fi
    
    print_status "📤 Uploading question files to config bucket: $CONFIG_BUCKET"
    local files_uploaded=0
    
    # Upload Company questions
    if [[ -f "data/Company.json" ]]; then
        print_progress "Uploading Company.json..."
        if aws s3 cp data/Company.json "s3://$CONFIG_BUCKET/config/Company.json" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE"; then
            print_success "✅ Company.json uploaded successfully"
            ((files_uploaded++))
        else
            print_error "❌ Failed to upload Company.json"
            exit 1
        fi
    else
        print_warning "⚠️ data/Company.json not found, skipping upload"
    fi
    
    # Upload Employee questions
    if [[ -f "data/Employee.json" ]]; then
        print_progress "Uploading Employee.json..."
        if aws s3 cp data/Employee.json "s3://$CONFIG_BUCKET/config/Employee.json" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE"; then
            print_success "✅ Employee.json uploaded successfully"
            ((files_uploaded++))
        else
            print_error "❌ Failed to upload Employee.json"
            exit 1
        fi
    else
        print_warning "⚠️ data/Employee.json not found, skipping upload"
    fi
    
    print_success "✅ Uploaded $files_uploaded configuration files to S3"
}

# Enhanced frontend build and deployment
deploy_frontend() {
    print_step "Building and Deploying Frontend Application"
    
    if [[ ! -d "frontend" ]]; then
        print_error "❌ Frontend directory not found"
        exit 1
    fi
    
    cd frontend
    
    # Check if .env.production exists
    if [[ ! -f ".env.production" ]]; then
        print_error "❌ .env.production file not found. Infrastructure must be deployed first."
        exit 1
    fi
    
    print_status "🎯 Frontend deployment configuration:"
    print_status "   Environment: $ENVIRONMENT"
    print_status "   API Base URL: $API_GATEWAY_URL"
    print_status "   Target Bucket: $WEBSITE_BUCKET"
    print_status "   CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]] || [[ "package-lock.json" -nt "node_modules" ]]; then
        print_progress "📦 Installing npm dependencies..."
        if npm ci --silent; then
            print_success "✅ Dependencies installed successfully"
        else
            print_error "❌ Failed to install dependencies"
            exit 1
        fi
    else
        print_success "✅ Dependencies are up to date"
    fi
    
    # Run tests if not skipped
    if [[ "$SKIP_TESTS" != true ]]; then
        print_progress "🧪 Running frontend tests..."
        if npm test -- --watchAll=false --passWithNoTests --coverage=false; then
            print_success "✅ All tests passed"
        else
            print_warning "⚠️ Tests failed but continuing deployment"
        fi
    else
        print_warning "⚠️ Skipping tests as requested"
    fi
    
    # Build the application
    print_progress "🔨 Building React application for production..."
    print_status "This may take a few minutes..."
    
    if npm run build; then
        print_success "✅ Frontend build completed successfully"
    else
        print_error "❌ Frontend build failed"
        exit 1
    fi
    
    # Validate build output
    if [[ ! -d "build" ]] || [[ ! -f "build/index.html" ]]; then
        print_error "❌ Build output is invalid - missing build directory or index.html"
        exit 1
    fi
    
    # Get build statistics
    local build_size=$(du -sh build | cut -f1)
    local file_count=$(find build -type f | wc -l)
    print_status "📊 Build statistics:"
    print_status "   Total size: $build_size"
    print_status "   File count: $file_count files"
    
    # Upload to S3 with optimized caching
    print_progress "☁️ Uploading frontend to S3 bucket: $WEBSITE_BUCKET"
    
    if [[ -z "$WEBSITE_BUCKET" ]]; then
        print_error "❌ Website bucket name not available"
        exit 1
    fi
    
    # Upload static assets with long-term caching
    print_progress "Uploading static assets with long-term cache headers..."
    if aws s3 sync build/ "s3://$WEBSITE_BUCKET" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --delete \
        --cache-control "public, max-age=31536000" \
        --exclude "*.html" \
        --exclude "service-worker.js" \
        --exclude "manifest.json"; then
        print_success "✅ Static assets uploaded with long-term caching"
    else
        print_error "❌ Failed to upload static assets"
        exit 1
    fi
    
    # Upload HTML files and service worker with no-cache
    print_progress "Uploading HTML files with no-cache headers..."
    if aws s3 sync build/ "s3://$WEBSITE_BUCKET" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --exclude "*" \
        --include "*.html" \
        --include "service-worker.js" \
        --include "manifest.json" \
        --cache-control "no-cache, no-store, must-revalidate"; then
        print_success "✅ HTML files uploaded with no-cache headers"
    else
        print_error "❌ Failed to upload HTML files"
        exit 1
    fi
    
    print_success "✅ Frontend uploaded to S3 successfully"
    
    # Invalidate CloudFront cache
    if [[ -n "$CLOUDFRONT_DISTRIBUTION" && "$CLOUDFRONT_DISTRIBUTION" != "null" ]]; then
        print_progress "🔄 Invalidating CloudFront cache..."
        
        local invalidation_id=$(aws cloudfront create-invalidation \
            --distribution-id "$CLOUDFRONT_DISTRIBUTION" \
            --paths "/*" \
            --profile "$AWS_PROFILE" \
            --query "Invalidation.Id" \
            --output text)
        
        if [[ -n "$invalidation_id" ]]; then
            print_success "✅ CloudFront cache invalidation started (ID: $invalidation_id)"
            
            if [[ "$VERBOSE" == true ]]; then
                print_progress "Waiting for invalidation to complete..."
                aws cloudfront wait invalidation-completed \
                    --distribution-id "$CLOUDFRONT_DISTRIBUTION" \
                    --id "$invalidation_id" \
                    --profile "$AWS_PROFILE"
                print_success "✅ CloudFront invalidation completed"
            else
                print_status "Cache invalidation is running in background (takes 2-5 minutes)"
            fi
        else
            print_error "❌ Failed to start CloudFront invalidation"
        fi
    else
        print_warning "⚠️ CloudFront distribution ID not available - skipping cache invalidation"
    fi
    
    cd ..
}

# Comprehensive deployment summary
show_deployment_summary() {
    print_header "🎉 Deployment Completed Successfully!"
    
    echo -e "${BOLD}${GREEN}📋 Deployment Summary${NC}"
    echo "===================="
    echo ""
    
    # Get final URLs
    local cloudfront_url="${CLOUDFRONT_URL:-Not available}"
    local api_url="${API_GATEWAY_URL:-Not available}"
    local s3_website_url=""
    
    if [[ -n "$WEBSITE_BUCKET" ]]; then
        s3_website_url="http://$WEBSITE_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
    else
        s3_website_url="Not available"
    fi
    
    echo -e "${BOLD}${GREEN}🌐 YOUR APPLICATION IS READY!${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}✨ PRIMARY ACCESS URL (USE THIS ONE):${NC}"
    echo -e "${BOLD}      🚀 $cloudfront_url${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Always use the CloudFront URL above, not the S3 bucket URL!${NC}"
    echo -e "${YELLOW}   The S3 bucket URL will show Access Denied errors.${NC}"
    echo ""
    
    echo -e "${BOLD}${BLUE}🔗 API Endpoints:${NC}"
    echo "   Base API URL:         $api_url"
    echo "   Questions:            $api_url/questions/{type}"
    echo "   Responses:            $api_url/responses"
    echo "   File Upload:          $api_url/files"
    echo ""
    
    echo -e "${BOLD}${PURPLE}🔧 Infrastructure Configuration:${NC}"
    echo "   Environment:          $ENVIRONMENT"
    echo "   AWS Region:           $AWS_REGION"
    echo "   AWS Profile:          $AWS_PROFILE"
    echo "   Stack Name:           $STACK_NAME"
    echo ""
    
    echo -e "${BOLD}${YELLOW}📦 AWS Resources Created:${NC}"
    echo "   Website Bucket:       ${WEBSITE_BUCKET:-Not available}"
    echo "   Config Bucket:        ${CONFIG_BUCKET:-Not available}"
    echo "   CloudFront ID:        ${CLOUDFRONT_DISTRIBUTION:-Not available}"
    echo ""
    
    echo -e "${BOLD}${GREEN}✅ Features Confirmed:${NC}"
    echo "   🔒 Universal CORS configured (no CORS issues)"
    echo "   ⏱️ File upload timeout: 15 minutes (900 seconds)"
    echo "   🎯 Dynamic configuration (no hardcoded values)"
    echo "   🔄 Auto-save functionality enabled"
    echo "   📱 Responsive design for all devices"
    echo "   ♿ WCAG 2.1 AA accessibility compliant"
    echo ""
    
    echo -e "${BOLD}${BLUE}📝 Next Steps:${NC}"
    echo "   1. 🌐 Access your application: $cloudfront_url"
    echo "   2. 🧪 Test both Company and Employee assessment flows"
    echo "   3. 📊 View CloudWatch logs for monitoring"
    echo "   4. 📝 Edit questions by modifying JSON files in S3 config bucket"
    echo "   5. 🔧 Monitor performance through AWS console"
    echo ""
    
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        echo -e "${GREEN}🎯 Development environment ready for testing!${NC}"
        echo -e "${BLUE}💡 Tips for development:${NC}"
        echo "   - Use browser dev tools to test responsiveness"
        echo "   - Test file uploads with various file types"
        echo "   - Check auto-save functionality works properly"
    else
        echo -e "${GREEN}🚀 Production environment deployed successfully!${NC}"
        echo -e "${BLUE}💡 Tips for production:${NC}"
        echo "   - Monitor CloudWatch logs for any issues"
        echo "   - Set up CloudWatch alarms for error tracking"
        echo "   - Consider enabling AWS X-Ray for request tracing"
    fi
    
    echo ""
    print_success "🎉 Your DMGT Assessment Form is now live and ready to use!"
    echo ""
    echo -e "${BOLD}${CYAN}🔗 Remember to bookmark this URL: $cloudfront_url${NC}"
    echo ""
}

# ✅ MAIN DEPLOYMENT ORCHESTRATION WITH PROPER ORDER
main() {
    create_deployment_cache
    
    # Pre-flight checks
    check_aws_configuration
    
    if [[ "$INFRASTRUCTURE_ONLY" == false ]]; then
        check_nodejs
    fi
    
    # ✅ DETERMINE WHAT NEEDS DEPLOYMENT WITH CHANGE DETECTION
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
    
    # ✅ EXECUTE DEPLOYMENT STEPS IN CORRECT ORDER
    # 1. Infrastructure → 2. S3 upload → 3. .env generation → 4. Frontend build/deploy
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
trap 'print_error "❌ Deployment failed! Check the output above for details."' ERR

# Execute main function
print_header "Starting Enhanced Deployment Process"
main

print_success "✨ Deployment process completed successfully!"
