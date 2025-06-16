#!/bin/bash

# DMGT Data & AI Readiness Assessment Form - Destroy Script
# Complete environment cleanup with safety confirmations

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
AWS_REGION="us-east-1"
STACK_NAME=""
FORCE=false

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
    echo "  --environment <env>    Environment to destroy (dev or prod)"
    echo ""
    echo "Options:"
    echo "  --region <region>      AWS region (default: us-east-1)"
    echo "  --force               Skip confirmation prompts (DANGEROUS)"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --environment dev"
    echo "  $0 --environment prod --region us-west-2"
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
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --force)
            FORCE=true
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
print_status "Stack Name: $STACK_NAME"

# Check AWS CLI
check_aws_cli() {
    print_status "Checking AWS CLI configuration..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured or credentials are invalid"
        exit 1
    fi
    
    print_success "AWS CLI is properly configured"
}

# Check if stack exists
check_stack_exists() {
    print_status "Checking if CloudFormation stack exists..."
    
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" &> /dev/null; then
        print_success "Stack '$STACK_NAME' found"
        return 0
    else
        print_warning "Stack '$STACK_NAME' does not exist"
        return 1
    fi
}

# Get stack resources before deletion
get_stack_resources() {
    print_status "Getting stack resources..."
    
    # Get S3 buckets
    WEBSITE_BUCKET=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucket'].OutputValue" \
        --output text 2>/dev/null || echo "")\n    \n    CONFIG_BUCKET=$(aws cloudformation describe-stacks \\\n        --stack-name \"$STACK_NAME\" \\\n        --region \"$AWS_REGION\" \\\n        --query \"Stacks[0].Outputs[?OutputKey=='ConfigBucket'].OutputValue\" \\\n        --output text 2>/dev/null || echo \"\")\n    \n    RESPONSES_BUCKET=$(aws cloudformation describe-stacks \\\n        --stack-name \"$STACK_NAME\" \\\n        --region \"$AWS_REGION\" \\\n        --query \"Stacks[0].Outputs[?OutputKey=='ResponsesBucket'].OutputValue\" \\\n        --output text 2>/dev/null || echo \"\")\n    \n    FILES_BUCKET=$(aws cloudformation describe-stacks \\\n        --stack-name \"$STACK_NAME\" \\\n        --region \"$AWS_REGION\" \\\n        --query \"Stacks[0].Outputs[?OutputKey=='FilesBucket'].OutputValue\" \\\n        --output text 2>/dev/null || echo \"\")\n    \n    # Get CloudFront distribution\n    CLOUDFRONT_DISTRIBUTION=$(aws cloudformation describe-stacks \\\n        --stack-name \"$STACK_NAME\" \\\n        --region \"$AWS_REGION\" \\\n        --query \"Stacks[0].Outputs[?OutputKey=='CloudFrontDistribution'].OutputValue\" \\\n        --output text 2>/dev/null || echo \"\")\n    \n    print_success \"Resources identified:\"\n    [[ -n \"$WEBSITE_BUCKET\" ]] && echo \"   📦 Website Bucket: $WEBSITE_BUCKET\"\n    [[ -n \"$CONFIG_BUCKET\" ]] && echo \"   📦 Config Bucket: $CONFIG_BUCKET\"\n    [[ -n \"$RESPONSES_BUCKET\" ]] && echo \"   📦 Responses Bucket: $RESPONSES_BUCKET\"\n    [[ -n \"$FILES_BUCKET\" ]] && echo \"   📦 Files Bucket: $FILES_BUCKET\"\n    [[ -n \"$CLOUDFRONT_DISTRIBUTION\" ]] && echo \"   🌐 CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION\"\n}\n\n# Show warning and get confirmation\nget_confirmation() {\n    if [[ \"$FORCE\" == true ]]; then\n        print_warning \"Force mode enabled - skipping confirmations\"\n        return 0\n    fi\n    \n    echo \"\"\n    print_error \"⚠️  DANGER ZONE ⚠️\"\n    echo \"\"\n    echo \"You are about to PERMANENTLY DELETE the following:\"\n    echo \"   🔥 All assessment responses and data\"\n    echo \"   🔥 All uploaded files\"\n    echo \"   🔥 All configuration files\"\n    echo \"   🔥 All AWS infrastructure resources\"\n    echo \"   🔥 CloudFront distribution\"\n    echo \"   🔥 Lambda functions and API Gateway\"\n    echo \"   🔥 S3 buckets and their contents\"\n    echo \"\"\n    print_error \"This action CANNOT be undone!\"\n    echo \"\"\n    \n    read -p \"Are you absolutely sure you want to destroy the '$ENVIRONMENT' environment? (yes/no): \" confirm1\n    \n    if [[ \"$confirm1\" != \"yes\" ]]; then\n        print_status \"Destruction cancelled\"\n        exit 0\n    fi\n    \n    echo \"\"\n    read -p \"Type the environment name '$ENVIRONMENT' to confirm: \" confirm2\n    \n    if [[ \"$confirm2\" != \"$ENVIRONMENT\" ]]; then\n        print_error \"Environment name mismatch. Destruction cancelled\"\n        exit 1\n    fi\n    \n    echo \"\"\n    print_warning \"Proceeding with destruction in 5 seconds... (Ctrl+C to cancel)\"\n    sleep 5\n}\n\n# Empty S3 bucket\nempty_s3_bucket() {\n    local bucket_name=\"$1\"\n    local bucket_description=\"$2\"\n    \n    if [[ -z \"$bucket_name\" || \"$bucket_name\" == \"None\" ]]; then\n        return 0\n    fi\n    \n    print_status \"Emptying $bucket_description ($bucket_name)...\"\n    \n    # Check if bucket exists\n    if ! aws s3api head-bucket --bucket \"$bucket_name\" --region \"$AWS_REGION\" &> /dev/null; then\n        print_warning \"Bucket $bucket_name does not exist, skipping\"\n        return 0\n    fi\n    \n    # Delete all objects including versions\n    aws s3api delete-objects \\\n        --bucket \"$bucket_name\" \\\n        --delete \"$(aws s3api list-object-versions \\\n            --bucket \"$bucket_name\" \\\n            --output json \\\n            --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}')\" \\\n        --region \"$AWS_REGION\" &> /dev/null || true\n    \n    # Delete all delete markers\n    aws s3api delete-objects \\\n        --bucket \"$bucket_name\" \\\n        --delete \"$(aws s3api list-object-versions \\\n            --bucket \"$bucket_name\" \\\n            --output json \\\n            --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')\" \\\n        --region \"$AWS_REGION\" &> /dev/null || true\n    \n    # Final cleanup using s3 rm\n    aws s3 rm \"s3://$bucket_name\" --recursive --region \"$AWS_REGION\" &> /dev/null || true\n    \n    print_success \"$bucket_description emptied\"\n}\n\n# Empty all S3 buckets\nempty_all_buckets() {\n    print_status \"🗑️  Emptying all S3 buckets...\"\n    \n    empty_s3_bucket \"$WEBSITE_BUCKET\" \"Website Bucket\"\n    empty_s3_bucket \"$CONFIG_BUCKET\" \"Config Bucket\"\n    empty_s3_bucket \"$RESPONSES_BUCKET\" \"Responses Bucket\"\n    empty_s3_bucket \"$FILES_BUCKET\" \"Files Bucket\"\n    \n    print_success \"All S3 buckets emptied\"\n}\n\n# Delete CloudFormation stack\ndelete_cloudformation_stack() {\n    print_status \"🗑️  Deleting CloudFormation stack...\"\n    \n    aws cloudformation delete-stack \\\n        --stack-name \"$STACK_NAME\" \\\n        --region \"$AWS_REGION\"\n    \n    print_status \"Waiting for stack deletion to complete...\"\n    print_status \"This may take several minutes...\"\n    \n    # Wait for stack deletion with progress indicator\n    local timeout=1800  # 30 minutes\n    local elapsed=0\n    local interval=30\n    \n    while [[ $elapsed -lt $timeout ]]; do\n        if ! aws cloudformation describe-stacks --stack-name \"$STACK_NAME\" --region \"$AWS_REGION\" &> /dev/null; then\n            print_success \"CloudFormation stack deleted successfully\"\n            return 0\n        fi\n        \n        # Get stack status\n        local status=$(aws cloudformation describe-stacks \\\n            --stack-name \"$STACK_NAME\" \\\n            --region \"$AWS_REGION\" \\\n            --query \"Stacks[0].StackStatus\" \\\n            --output text 2>/dev/null || echo \"NOT_FOUND\")\n        \n        if [[ \"$status\" == \"DELETE_FAILED\" ]]; then\n            print_error \"Stack deletion failed\"\n            \n            # Show failed resources\n            print_status \"Failed resources:\"\n            aws cloudformation describe-stack-events \\\n                --stack-name \"$STACK_NAME\" \\\n                --region \"$AWS_REGION\" \\\n                --query \"StackEvents[?ResourceStatus=='DELETE_FAILED'].{Resource:LogicalResourceId,Reason:ResourceStatusReason}\" \\\n                --output table\n            \n            exit 1\n        fi\n        \n        printf \".\"\n        sleep $interval\n        elapsed=$((elapsed + interval))\n    done\n    \n    print_error \"Stack deletion timed out after $(($timeout/60)) minutes\"\n    exit 1\n}\n\n# Verify complete cleanup\nverify_cleanup() {\n    print_status \"🔍 Verifying complete cleanup...\"\n    \n    # Check if stack still exists\n    if aws cloudformation describe-stacks --stack-name \"$STACK_NAME\" --region \"$AWS_REGION\" &> /dev/null; then\n        print_warning \"CloudFormation stack still exists\"\n        return 1\n    fi\n    \n    # Check if buckets still exist\n    local buckets_exist=false\n    \n    for bucket in \"$WEBSITE_BUCKET\" \"$CONFIG_BUCKET\" \"$RESPONSES_BUCKET\" \"$FILES_BUCKET\"; do\n        if [[ -n \"$bucket\" && \"$bucket\" != \"None\" ]] && aws s3api head-bucket --bucket \"$bucket\" --region \"$AWS_REGION\" &> /dev/null; then\n            print_warning \"Bucket $bucket still exists\"\n            buckets_exist=true\n        fi\n    done\n    \n    if [[ \"$buckets_exist\" == true ]]; then\n        return 1\n    fi\n    \n    print_success \"Cleanup verification completed\"\n    return 0\n}\n\n# Show cleanup summary\nshow_cleanup_summary() {\n    echo \"\"\n    print_success \"🎉 Environment destruction completed successfully!\"\n    echo \"\"\n    echo \"📋 Destroyed resources:\"\n    echo \"   ✅ CloudFormation stack: $STACK_NAME\"\n    echo \"   ✅ All S3 buckets and contents\"\n    echo \"   ✅ CloudFront distribution\"\n    echo \"   ✅ Lambda functions\"\n    echo \"   ✅ API Gateway\"\n    echo \"   ✅ IAM roles and policies\"\n    echo \"\"\n    echo \"💡 Notes:\"\n    echo \"   - All assessment data has been permanently deleted\"\n    echo \"   - CloudFront distribution may take up to 24 hours to fully remove\"\n    echo \"   - No ongoing AWS charges for this environment\"\n    echo \"\"\n    print_success \"Environment '$ENVIRONMENT' has been completely destroyed.\"\n}\n\n# Main destruction logic\nmain() {\n    # Pre-flight checks\n    check_aws_cli\n    \n    # Check if stack exists\n    if ! check_stack_exists; then\n        print_warning \"No stack found to destroy\"\n        exit 0\n    fi\n    \n    # Get resources before deletion\n    get_stack_resources\n    \n    # Get user confirmation\n    get_confirmation\n    \n    # Start destruction process\n    print_status \"🚀 Starting environment destruction...\"\n    \n    # Empty S3 buckets first (required before CloudFormation can delete them)\n    empty_all_buckets\n    \n    # Delete CloudFormation stack\n    delete_cloudformation_stack\n    \n    # Verify cleanup\n    if verify_cleanup; then\n        show_cleanup_summary\n    else\n        print_warning \"Cleanup verification found some remaining resources\"\n        print_warning \"Please check the AWS console for any remaining resources\"\n    fi\n}\n\n# Trap errors\ntrap 'print_error \"Destruction failed! Check the output above for details.\"' ERR\n\n# Run main function\nmain\n\nprint_success \"✨ Destruction complete!\"\n