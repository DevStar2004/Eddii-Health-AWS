import { Construct } from 'constructs';
import { EddiiBackendConfig, EnvironmentConfig } from '../config';
import { Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { CfnCacheCluster, CfnSubnetGroup } from 'aws-cdk-lib/aws-elasticache';
import { aws_elasticache } from 'aws-cdk-lib';

export class Caches extends Construct {
    public dexcomCacheCluster: CfnCacheCluster;

    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        vpc: Vpc,
        lambdaSecurityGroup: SecurityGroup,
        id: string,
    ) {
        super(scope, id);

        // create a subnet group for our dexcom cache cluster to utilise
        const subnetGroup = new CfnSubnetGroup(this, 'DexcomCacheSubnetGroup', {
            subnetIds: vpc.selectSubnets({
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            }).subnetIds,
            cacheSubnetGroupName: `dexcom-cache-subnet-group-${config.stage}`,
            description: 'subnet group for our dexcom cache cluster',
        });

        // add a security group for the dax cluster
        const dexcomSecurityGroup = new SecurityGroup(this, 'DexcomCacheSG', {
            vpc: vpc,
            description:
                'SecurityGroup associated with the Dexcom Cache Cluster',
            allowAllOutbound: true,
            securityGroupName: `dexcom-cache-vpc-sg-${config.stage}`,
        });

        // allow inbound traffic from the lambda security group on port 6379
        dexcomSecurityGroup.addIngressRule(lambdaSecurityGroup, Port.tcp(6379));

        this.dexcomCacheCluster = new aws_elasticache.CfnCacheCluster(
            this,
            'DexcomCacheCluster',
            {
                engine: 'redis',
                cacheNodeType:
                    config.stage === 'prod'
                        ? 'cache.t4g.medium'
                        : 'cache.t4g.micro',
                numCacheNodes: 1,
                cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
                vpcSecurityGroupIds: [dexcomSecurityGroup.securityGroupId],
                preferredMaintenanceWindow: 'sun:01:00-sun:09:00',
                snapshotWindow: '17:00-01:00',
            },
        );
        this.dexcomCacheCluster.addDependency(subnetGroup);
    }

    public getEnvs(): EnvironmentConfig {
        return {
            DEXCOM_REDIS_ENDPOINT:
                this.dexcomCacheCluster.attrRedisEndpointAddress,
        };
    }
}
