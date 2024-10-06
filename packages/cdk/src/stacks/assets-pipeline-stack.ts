import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class EddiiAssetsPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Define the source artifact
        const sourceArtifact = new codepipeline.Artifact();
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub_Source',
            owner: 'eddiihealth',
            repo: 'eddii-assets',
            oauthToken: cdk.SecretValue.secretsManager('github-token'),
            output: sourceArtifact,
            branch: 'main',
        });

        // Define the pipeline
        new codepipeline.Pipeline(this, 'EddiiAssetsPipeline', {
            pipelineName: 'EddiiAssetsPipeline',
            stages: [
                {
                    stageName: 'Source',
                    actions: [sourceAction],
                },
                {
                    stageName: 'DeployToSandbox',
                    actions: [
                        new codepipeline_actions.S3DeployAction({
                            actionName: 'DeployToSandbox',
                            bucket: s3.Bucket.fromBucketName(
                                this,
                                'SandboxBucket',
                                'com.eddiihealth.eddii.sandbox.assets',
                            ),
                            input: sourceArtifact,
                            role: cdk.aws_iam.Role.fromRoleArn(
                                this,
                                'SandboxDeploymentRole',
                                'arn:aws:iam::831897950842:role/EddiiAssetsPipelineRole',
                                { mutable: false },
                            ),
                        }),
                        new codepipeline_actions.ManualApprovalAction({
                            actionName: 'ApproveDeployment',
                        }),
                    ],
                },
                {
                    stageName: 'DeployToStaging',
                    actions: [
                        new codepipeline_actions.S3DeployAction({
                            actionName: 'DeployToStaging',
                            bucket: s3.Bucket.fromBucketName(
                                this,
                                'StagingBucket',
                                'com.eddiihealth.eddii.staging.assets',
                            ),
                            input: sourceArtifact,
                            role: cdk.aws_iam.Role.fromRoleArn(
                                this,
                                'StagingDeploymentRole',
                                'arn:aws:iam::062467268133:role/EddiiAssetsPipelineRole',
                                { mutable: false },
                            ),
                        }),
                        new codepipeline_actions.ManualApprovalAction({
                            actionName: 'ApproveDeployment',
                        }),
                    ],
                },
                {
                    stageName: 'DeployToProduction',
                    actions: [
                        new codepipeline_actions.S3DeployAction({
                            actionName: 'DeployToProduction',
                            bucket: s3.Bucket.fromBucketName(
                                this,
                                'ProductionBucket',
                                'com.eddiihealth.eddii.assets',
                            ),
                            input: sourceArtifact,
                            role: cdk.aws_iam.Role.fromRoleArn(
                                this,
                                'ProdDeploymentRole',
                                'arn:aws:iam::035329067410:role/EddiiAssetsPipelineRole',
                                { mutable: false },
                            ),
                        }),
                    ],
                },
            ],
        });
    }
}
