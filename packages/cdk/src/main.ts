import { App } from 'aws-cdk-lib';
import { EddiiPipelineStack } from './stacks/pipeline-stack';
import { EddiiAssetsPipelineStack } from './stacks/assets-pipeline-stack';

const app = new App();

// BE Pipeline Stack
new EddiiPipelineStack(app, 'EddiiPipeline', {
    env: {
        account: '547382478879',
        region: 'us-east-1',
    },
});

// Assets Pipeline Stack
new EddiiAssetsPipelineStack(app, 'EddiiAssetsPipeline', {
    env: {
        account: '547382478879',
        region: 'us-east-1',
    },
});
