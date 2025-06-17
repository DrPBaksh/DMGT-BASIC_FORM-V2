# DMGT Assessment Form - Troubleshooting Guide

## Common Issues and Solutions

### 1. Access Denied Error when Accessing Website

**Problem**: You see an "Access Denied" error when trying to access your website, typically when accessing the S3 bucket URL directly.

**Example Error**:
```xml
<Error>
<Code>AccessDenied</Code>
<Message>Access Denied</Message>
<RequestId>...</RequestId>
<HostId>...</HostId>
</Error>
```

**Root Cause**: 
- Accessing S3 bucket URL instead of CloudFront URL
- Circular dependency in CloudFormation template causing improper bucket policy
- Incorrect public access block configuration

**Solution**:

1. **Use the correct URL**: Always use the CloudFront URL, never the S3 bucket URL
   - ✅ Correct: `https://[cloudfront-id].cloudfront.net`
   - ❌ Wrong: `https://[bucket-name].s3.[region].amazonaws.com`

2. **Redeploy infrastructure** with the fixed template:
   ```bash
   ./deploy.sh --environment dev --infrastructure-only --force
   ```

3. **Then redeploy frontend**:
   ```bash
   ./deploy.sh --environment dev --frontend-only --force
   ```

### 2. CORS Issues

**Problem**: Browser console shows CORS errors when making API calls.

**Solution**: The CloudFormation template includes comprehensive CORS configuration. If issues persist:

1. Check that all Lambda functions have CORS headers enabled
2. Verify API Gateway OPTIONS methods are properly configured
3. Redeploy with: `./deploy.sh --environment dev --force`

### 3. API Gateway 404 Errors

**Problem**: API calls return 404 errors.

**Solution**:
1. Check the API Gateway URL in the deployment summary
2. Ensure you're using the correct environment (dev/prod)
3. Verify the API endpoints are properly deployed

### 4. File Upload Timeouts

**Problem**: Large file uploads fail or timeout.

**Solution**: The Lambda function is configured with 15-minute timeout and maximum memory. If issues persist:
1. Check file size limits in your application
2. Consider implementing presigned URL uploads for very large files
3. Monitor CloudWatch logs for specific error messages

### 5. Questions Not Loading

**Problem**: Assessment questions don't load in the frontend.

**Solution**:
1. Verify question files are uploaded to S3:
   ```bash
   aws s3 ls s3://[config-bucket]/config/ --profile dmgt-account
   ```
2. Check that `Company.json` and `Employee.json` exist in the `data/` directory
3. Redeploy configuration: `./deploy.sh --environment dev --infrastructure-only`

### 6. CloudFront Distribution Not Working

**Problem**: CloudFront URL returns errors or shows cached old content.

**Solution**:
1. Wait 5-10 minutes for distribution to fully deploy
2. Create cache invalidation:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id [DISTRIBUTION-ID] \
     --paths "/*" \
     --profile dmgt-account
   ```
3. Check CloudFront distribution status in AWS Console

### 7. AWS Profile Issues

**Problem**: Deployment fails with authentication errors.

**Solution**:
1. Verify AWS profile is configured:
   ```bash
   aws sts get-caller-identity --profile dmgt-account
   ```
2. Reconfigure if needed:
   ```bash
   aws configure --profile dmgt-account
   ```
3. Ensure profile has necessary IAM permissions

## Getting Help

### Check Deployment Status
```bash
aws cloudformation describe-stacks \
  --stack-name dmgt-assessment-form-dev \
  --profile dmgt-account \
  --region eu-west-2
```

### View CloudWatch Logs
```bash
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/dmgt-assessment" \
  --profile dmgt-account \
  --region eu-west-2
```

### Common Commands

**Full Redeploy**:
```bash
./deploy.sh --environment dev --force
```

**Infrastructure Only**:
```bash
./deploy.sh --environment dev --infrastructure-only --force
```

**Frontend Only**:
```bash
./deploy.sh --environment dev --frontend-only --force
```

**Verbose Output**:
```bash
./deploy.sh --environment dev --verbose
```

## Quick Fix for Most Issues

If you're experiencing any access or deployment issues, try this sequence:

1. **Update infrastructure**:
   ```bash
   ./deploy.sh --environment dev --infrastructure-only --force
   ```

2. **Wait 2-3 minutes** for resources to be ready

3. **Deploy frontend**:
   ```bash
   ./deploy.sh --environment dev --frontend-only --force
   ```

4. **Wait 5-10 minutes** for CloudFront distribution to update

5. **Access your application** using the CloudFront URL shown in the deployment summary

## Resources

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/s3/latest/userguide/WebsiteHosting.html)
- [AWS API Gateway CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)
