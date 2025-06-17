#!/bin/bash

# Enhanced Destroy Script for DMGT Basic Form V2
# Complete environment cleanup with safety confirmations and dmgt-account profile support

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default values (matching deploy script)
ENVIRONMENT=""
AWS_REGION="eu-west-2"  # ✅ Match deploy script default
AWS_PROFILE="dmgt-account"  # ✅ Match deploy script default
STACK_NAME=""
FORCE=false
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
    echo "Enhanced DMGT Basic Form V2 Destruction Script"
    echo ""
    echo "Usage: $0 --environment <dev|prod> [options]"
    echo ""
    echo "Required:"
    echo "  --environment <env>    Environment to destroy (dev or prod)"
    echo ""
    echo "Options:"
    echo "  --profile <profile>    AWS profile to use (default: dmgt-account)"
    echo "  --region <region>      AWS region (default: eu-west-2)"
    echo "  --force               Skip confirmation prompts (DANGEROUS)"
    echo "  --verbose             Enable verbose output"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --environment dev"
    echo "  $0 --environment prod --profile dmgt-account --region eu-west-2"
    echo "  $0 --environment dev --force"
    echo ""
    echo "⚠️  WARNING: This will permanently delete all data and resources!"
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
        --force)
            FORCE=true
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

# Set environment-specific variables
STACK_NAME="dmgt-assessment-form-$ENVIRONMENT"

print_status "🔥 DMGT Assessment Form Environment Destruction"
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

# Check if stack exists
check_stack_exists() {
    print_status "🔍 Checking if CloudFormation stack exists..."
    
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" --profile "$AWS_PROFILE" &> /dev/null; then
        STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" --profile "$AWS_PROFILE" --query "Stacks[0].StackStatus" --output text)
        print_success "Stack '$STACK_NAME' found (Status: $STACK_STATUS)"
        
        # Handle different stack states
        if [[ "$STACK_STATUS" == "ROLLBACK_COMPLETE" || "$STACK_STATUS" == "CREATE_FAILED" ]]; then
            print_warning "Stack is in $STACK_STATUS state - will delete directly"
            NEEDS_BUCKET_CLEANUP=false
        else
            NEEDS_BUCKET_CLEANUP=true
        fi
        
        return 0
    else
        print_warning "Stack '$STACK_NAME' does not exist"
        return 1
    fi
}

# Get stack resources before deletion
get_stack_resources() {
    print_status "📋 Getting stack resources..."
    
    # Only try to get outputs if stack is in a valid state
    if [[ "$STACK_STATUS" != "ROLLBACK_COMPLETE" && "$STACK_STATUS" != "CREATE_FAILED" ]]; then
        # Get S3 buckets
        WEBSITE_BUCKET=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE" \
            --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucket'].OutputValue" \
            --output text 2>/dev/null || echo "")
        
        CONFIG_BUCKET=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE" \
            --query "Stacks[0].Outputs[?OutputKey=='ConfigBucket'].OutputValue" \
            --output text 2>/dev/null || echo "")
        
        RESPONSES_BUCKET=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE" \
            --query "Stacks[0].Outputs[?OutputKey=='ResponsesBucket'].OutputValue" \
            --output text 2>/dev/null || echo "")
        
        FILES_BUCKET=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE" \
            --query "Stacks[0].Outputs[?OutputKey=='FilesBucket'].OutputValue" \
            --output text 2>/dev/null || echo "")
        
        # Get CloudFront distribution
        CLOUDFRONT_DISTRIBUTION=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE" \
            --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistribution'].OutputValue" \
            --output text 2>/dev/null || echo "")
        
        print_success "Resources identified:"
        [[ -n "$WEBSITE_BUCKET" && "$WEBSITE_BUCKET" != "None" ]] && echo "   📦 Website Bucket: $WEBSITE_BUCKET"
        [[ -n "$CONFIG_BUCKET" && "$CONFIG_BUCKET" != "None" ]] && echo "   📦 Config Bucket: $CONFIG_BUCKET"
        [[ -n "$RESPONSES_BUCKET" && "$RESPONSES_BUCKET" != "None" ]] && echo "   📦 Responses Bucket: $RESPONSES_BUCKET"
        [[ -n "$FILES_BUCKET" && "$FILES_BUCKET" != "None" ]] && echo "   📦 Files Bucket: $FILES_BUCKET"
        [[ -n "$CLOUDFRONT_DISTRIBUTION" && "$CLOUDFRONT_DISTRIBUTION" != "None" ]] && echo "   🌐 CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION"
    else
        print_warning "Stack in $STACK_STATUS state - cannot retrieve resource details"
        WEBSITE_BUCKET=""
        CONFIG_BUCKET=""
        RESPONSES_BUCKET=""
        FILES_BUCKET=""
        CLOUDFRONT_DISTRIBUTION=""
    fi
}

# Show warning and get confirmation
get_confirmation() {
    if [[ "$FORCE" == true ]]; then
        print_warning "Force mode enabled - skipping confirmations"
        return 0
    fi
    
    echo ""
    print_error "⚠️  DANGER ZONE ⚠️"
    echo ""
    echo "You are about to PERMANENTLY DELETE the following:"
    echo "   🔥 All assessment responses and data"
    echo "   🔥 All uploaded files"
    echo "   🔥 All configuration files"
    echo "   🔥 All AWS infrastructure resources"
    echo "   🔥 CloudFront distribution"
    echo "   🔥 Lambda functions and API Gateway"
    echo "   🔥 S3 buckets and their contents"
    echo ""
    print_error "This action CANNOT be undone!"
    echo ""
    
    read -p "Are you absolutely sure you want to destroy the '$ENVIRONMENT' environment? (yes/no): " confirm1
    
    if [[ "$confirm1" != "yes" ]]; then
        print_status "Destruction cancelled"
        exit 0
    fi
    
    echo ""
    read -p "Type the environment name '$ENVIRONMENT' to confirm: " confirm2
    
    if [[ "$confirm2" != "$ENVIRONMENT" ]]; then
        print_error "Environment name mismatch. Destruction cancelled"
        exit 1
    fi
    
    echo ""
    print_warning "Proceeding with destruction in 5 seconds... (Ctrl+C to cancel)"
    sleep 5
}

# Empty S3 bucket
empty_s3_bucket() {
    local bucket_name="$1"
    local bucket_description="$2"
    
    if [[ -z "$bucket_name" || "$bucket_name" == "None" ]]; then
        return 0
    fi
    
    print_status "🗑️ Emptying $bucket_description ($bucket_name)..."
    
    # Check if bucket exists
    if ! aws s3api head-bucket --bucket "$bucket_name" --region "$AWS_REGION" --profile "$AWS_PROFILE" &> /dev/null; then
        print_warning "Bucket $bucket_name does not exist, skipping"
        return 0
    fi
    
    # Delete all objects including versions
    aws s3api delete-objects \
        --bucket "$bucket_name" \
        --delete "$(aws s3api list-object-versions \
            --bucket "$bucket_name" \
            --output json \
            --profile "$AWS_PROFILE" \
            --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}')" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" &> /dev/null || true
    
    # Delete all delete markers
    aws s3api delete-objects \
        --bucket "$bucket_name" \
        --delete "$(aws s3api list-object-versions \
            --bucket "$bucket_name" \
            --output json \
            --profile "$AWS_PROFILE" \
            --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" &> /dev/null || true
    
    # Final cleanup using s3 rm
    aws s3 rm "s3://$bucket_name" --recursive --region "$AWS_REGION" --profile "$AWS_PROFILE" &> /dev/null || true
    
    print_success "$bucket_description emptied"
}

# Empty all S3 buckets
empty_all_buckets() {
    if [[ "$NEEDS_BUCKET_CLEANUP" == false ]]; then
        print_status "⏭️ Skipping bucket cleanup for $STACK_STATUS stack"
        return 0
    fi
    
    print_status "🗑️ Emptying all S3 buckets..."
    
    empty_s3_bucket "$WEBSITE_BUCKET" "Website Bucket"
    empty_s3_bucket "$CONFIG_BUCKET" "Config Bucket"
    empty_s3_bucket "$RESPONSES_BUCKET" "Responses Bucket"
    empty_s3_bucket "$FILES_BUCKET" "Files Bucket"
    
    print_success "All S3 buckets emptied"
}

# Delete CloudFormation stack
delete_cloudformation_stack() {
    print_status "🗑️ Deleting CloudFormation stack..."
    
    aws cloudformation delete-stack \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE"
    
    print_status "⏳ Waiting for stack deletion to complete..."
    print_status "This may take several minutes..."
    
    # Wait for stack deletion with progress indicator
    local timeout=1800  # 30 minutes
    local elapsed=0
    local interval=30
    
    while [[ $elapsed -lt $timeout ]]; do
        if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" --profile "$AWS_PROFILE" &> /dev/null; then
            print_success "CloudFormation stack deleted successfully"
            return 0
        fi
        
        # Get stack status
        local status=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE" \
            --query "Stacks[0].StackStatus" \
            --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [[ "$status" == "DELETE_FAILED" ]]; then
            print_error "Stack deletion failed"
            
            # Show failed resources
            print_status "Failed resources:"
            aws cloudformation describe-stack-events \
                --stack-name "$STACK_NAME" \
                --region "$AWS_REGION" \
                --profile "$AWS_PROFILE" \
                --query "StackEvents[?ResourceStatus=='DELETE_FAILED'].{Resource:LogicalResourceId,Reason:ResourceStatusReason}" \
                --output table
            
            exit 1
        fi
        
        printf "."
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    print_error "Stack deletion timed out after $(($timeout/60)) minutes"
    exit 1
}

# Verify complete cleanup
verify_cleanup() {
    print_status "🔍 Verifying complete cleanup..."
    
    # Check if stack still exists
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" --profile "$AWS_PROFILE" &> /dev/null; then
        print_warning "CloudFormation stack still exists"
        return 1
    fi
    
    # Check if buckets still exist
    local buckets_exist=false
    
    for bucket in "$WEBSITE_BUCKET" "$CONFIG_BUCKET" "$RESPONSES_BUCKET" "$FILES_BUCKET"; do
        if [[ -n "$bucket" && "$bucket" != "None" ]] && aws s3api head-bucket --bucket "$bucket" --region "$AWS_REGION" --profile "$AWS_PROFILE" &> /dev/null; then
            print_warning "Bucket $bucket still exists"
            buckets_exist=true
        fi
    done
    
    if [[ "$buckets_exist" == true ]]; then
        return 1
    fi
    
    print_success "Cleanup verification completed"
    return 0
}

# Show cleanup summary
show_cleanup_summary() {
    echo ""
    print_success "🎉 Environment destruction completed successfully!"
    echo ""
    echo "📋 Destroyed resources:"
    echo "   ✅ CloudFormation stack: $STACK_NAME"
    echo "   ✅ All S3 buckets and contents"
    echo "   ✅ CloudFront distribution"
    echo "   ✅ Lambda functions"
    echo "   ✅ API Gateway"
    echo "   ✅ IAM roles and policies"
    echo ""
    echo "💡 Notes:"
    echo "   - All assessment data has been permanently deleted"
    echo "   - CloudFront distribution may take up to 24 hours to fully remove"
    echo "   - No ongoing AWS charges for this environment"
    echo ""
    print_success "Environment '$ENVIRONMENT' has been completely destroyed."
}

# Main destruction logic
main() {
    # Pre-flight checks
    check_aws_configuration
    
    # Check if stack exists
    if ! check_stack_exists; then
        print_warning "No stack found to destroy"
        exit 0
    fi
    
    # Get resources before deletion
    get_stack_resources
    
    # Get user confirmation
    get_confirmation
    
    # Start destruction process
    print_status "🚀 Starting environment destruction..."
    
    # Empty S3 buckets first (required before CloudFormation can delete them)
    empty_all_buckets
    
    # Delete CloudFormation stack
    delete_cloudformation_stack
    
    # Verify cleanup
    if verify_cleanup; then
        show_cleanup_summary
    else
        print_warning "Cleanup verification found some remaining resources"
        print_warning "Please check the AWS console for any remaining resources"
    fi
}

# Trap errors
trap 'print_error "Destruction failed! Check the output above for details."' ERR

# Run main function
print_status "Starting destruction process..."
main

print_success "✨ Destruction complete!"
