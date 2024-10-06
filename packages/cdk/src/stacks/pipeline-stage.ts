import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EddiiBackendStack } from './app-stack';
import { EddiiBackendConfig } from '../config';

export class EddiiPipelineStage extends cdk.Stage {
    public readonly userPoolIdCfnOutput: cdk.CfnOutput;
    public readonly userPoolClientIdCfnOutput: cdk.CfnOutput;
    public readonly daxClusterEndpointCfnOutput: cdk.CfnOutput;

    constructor(
        scope: Construct,
        id: string,
        config: EddiiBackendConfig,
        props?: cdk.StackProps,
    ) {
        super(scope, id, props);
        const stack = new EddiiBackendStack(this, id, config, props);
        this.userPoolIdCfnOutput = stack.userPoolIdCfnOutput;
        this.userPoolClientIdCfnOutput = stack.userPoolClientIdCfnOutput;
        this.daxClusterEndpointCfnOutput = stack.daxClusterEndpointCfnOutput;
    }
}
