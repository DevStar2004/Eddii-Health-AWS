import { Construct } from 'constructs';
import { EddiiBackendConfig } from '../config';
import { Stack, aws_wafv2 as waf } from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';

export class WAF extends Construct {
    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        apis: LambdaRestApi[],
        userPool: UserPool,
        id: string,
    ) {
        super(scope, id);
        /**
         * Setup WAF Rules
         */

        const wafRules: Array<waf.CfnWebACL.RuleProperty> = [];

        // 4 IP Rate limiting
        const ipRateLimit: waf.CfnWebACL.RuleProperty = {
            name: 'FloodProtection',
            action: { block: {} },
            priority: 1,
            statement: {
                rateBasedStatement: { aggregateKeyType: 'IP', limit: 2000 },
            },
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: true,
                metricName: `floodProtection`,
            },
        };

        wafRules.push(ipRateLimit);

        // 2 AWS Managed Rules
        const awsManagedRules: waf.CfnWebACL.RuleProperty = {
            name: 'AWS-AWSManagedRulesCommonRuleSet',
            priority: 2,
            overrideAction: { none: {} },
            statement: {
                managedRuleGroupStatement: {
                    name: 'AWSManagedRulesCommonRuleSet',
                    vendorName: 'AWS',
                    excludedRules: [
                        {
                            name: 'SizeRestrictions_BODY',
                        },
                    ],
                },
            },
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'awsCommonRules',
                sampledRequestsEnabled: true,
            },
        };

        wafRules.push(awsManagedRules);

        // 3 AWS ip reputation List
        const awsIPRepList: waf.CfnWebACL.RuleProperty = {
            name: 'awsIPReputation',
            priority: 4,
            overrideAction: { none: {} },
            statement: {
                managedRuleGroupStatement: {
                    name: 'AWSManagedRulesAmazonIpReputationList',
                    vendorName: 'AWS',
                    excludedRules: [],
                },
            },
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'awsReputation',
                sampledRequestsEnabled: true,
            },
        };

        wafRules.push(awsIPRepList);

        /**
         * Create and Associate ACL with Gateway
         */

        // Create our Web ACL
        const webACL = new waf.CfnWebACL(this, 'WebACL', {
            name: `web-acl-${config.stage.toString()}`,
            defaultAction: {
                allow: {},
            },
            scope: 'REGIONAL',
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: `WebACL-${config.stage}`,
                sampledRequestsEnabled: true,
            },
            rules: wafRules,
        });

        for (const api of apis) {
            // Associate with our gateway
            new waf.CfnWebACLAssociation(
                this,
                `WebACLAssociation${api.restApiName}`,
                {
                    webAclArn: webACL.attrArn,
                    resourceArn: `arn:aws:apigateway:${
                        Stack.of(this).region
                    }::/restapis/${api.restApiId}/stages/${
                        api.deploymentStage.stageName
                    }`,
                },
            );
        }
        // Cognito
        new waf.CfnWebACLAssociation(this, 'CognitoWebACLAssociation', {
            resourceArn: `arn:aws:cognito-idp:${Stack.of(this).region}:${
                Stack.of(this).account
            }:userpool/${userPool.userPoolId}`,
            webAclArn: webACL.attrArn,
        });
    }
}
