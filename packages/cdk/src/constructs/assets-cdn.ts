import { Construct } from 'constructs';
import { EddiiBackendConfig } from '../config';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { RemovalPolicy, aws_iam } from 'aws-cdk-lib';

export class AssetsCdn extends Construct {
    public distribution: cloudfront.Distribution;

    constructor(scope: Construct, config: EddiiBackendConfig, id: string) {
        super(scope, id);

        const bucket = new s3.Bucket(this, 'AssetsBucket', {
            bucketName:
                config.stage === 'prod' ||
                config.stage === 'staging' ||
                config.stage === 'sandbox'
                    ? config.stage === 'prod'
                        ? `com.eddiihealth.eddii.assets`
                        : `com.eddiihealth.eddii.${config.stage}.assets`
                    : undefined,
            publicReadAccess: false,
            removalPolicy: RemovalPolicy.RETAIN, // Be cautious with this in production
            autoDeleteObjects: false,
        });

        const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
        bucket.grantRead(oai);

        const pipelineRole = new aws_iam.Role(this, 'CrossAccountRole', {
            roleName: 'EddiiAssetsPipelineRole',
            assumedBy: new aws_iam.AccountPrincipal('547382478879'),
        });

        // Grant the cross-account role permissions to the bucket
        bucket.grantReadWrite(pipelineRole);
        pipelineRole.addToPolicy(
            new aws_iam.PolicyStatement({
                actions: [
                    's3:GetBucket*',
                    's3:GetObject*',
                    's3:List*',
                    'kms:Decrypt',
                    'kms:DescribeKey',
                ],
                resources: ['*'],
            }),
        );

        this.distribution = new cloudfront.Distribution(
            this,
            'AssetsDistribution',
            {
                defaultBehavior: {
                    origin: new origins.S3Origin(bucket),
                    viewerProtocolPolicy:
                        cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                },
            },
        );
    }
}
