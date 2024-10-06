import { Construct } from 'constructs';
import { RemovalPolicy, aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { EddiiBackendConfig, EnvironmentConfig } from '../config';
import { CfnTable } from 'aws-cdk-lib/aws-dynamodb';
import {
    CfnCluster,
    CfnParameterGroup,
    CfnSubnetGroup,
} from 'aws-cdk-lib/aws-dax';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { CfnNamespace } from 'aws-cdk-lib/aws-redshiftserverless';

export class Databases extends Construct {
    public dataEntryTable: dynamodb.Table;
    public deviceTable: dynamodb.Table;
    public guardianTable: dynamodb.Table;
    public leaderboardTable: dynamodb.Table;
    public missionTable: dynamodb.Table;
    public storeTable: dynamodb.Table;
    public streakTable: dynamodb.Table;
    public subscriptionTable: dynamodb.Table;
    public quizTable: dynamodb.Table;
    public userTable: dynamodb.Table;
    public userSessionTable: dynamodb.Table;
    public patientTable: dynamodb.Table;
    public chatTable: dynamodb.Table;
    public referralTable: dynamodb.Table;
    public dexcomEgvTable: dynamodb.Table;
    private daxCluster: CfnCluster | undefined;

    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        vpc: Vpc,
        lambdaSecurityGroup: SecurityGroup,
        id: string,
    ) {
        super(scope, id);

        const dataWarehouseEnabled =
            config.stage === 'prod' || config.stage === 'sandbox';

        if (config.stage !== 'dev') {
            const daxRole = new Role(this, 'DaxClusterRole', {
                assumedBy: new ServicePrincipal('dax.amazonaws.com'),
            });
            daxRole.addManagedPolicy(
                ManagedPolicy.fromAwsManagedPolicyName(
                    'AmazonDynamoDBFullAccess',
                ),
            );

            // create a subnet group for our dax cluster to utilise
            const subnetGroup = new CfnSubnetGroup(this, 'DaxSubnetGroup', {
                subnetIds: vpc.selectSubnets({
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                }).subnetIds,
                subnetGroupName: `dax-subnet-group-${config.stage}`,
                description: 'subnet group for our dax cluster',
            });

            // add a security group for the dax cluster
            const daxSecurityGroup = new SecurityGroup(this, 'DaxSG', {
                vpc: vpc,
                description: 'SecurityGroup associated with the Dax Cluster',
                allowAllOutbound: true,
                securityGroupName: `dax-vpc-sg-${config.stage}`,
            });

            // allow inbound traffic from the lambda security group on port 8111
            daxSecurityGroup.addIngressRule(
                lambdaSecurityGroup,
                Port.tcp(8111),
            );

            const daxParamterGroup = new CfnParameterGroup(
                this,
                'DaxParameterGroup',
                {
                    parameterNameValues: {
                        'record-ttl-millis': '28800000',
                        'query-ttl-millis': '300000',
                    },
                },
            );

            this.daxCluster = new CfnCluster(this, 'DaxCluster', {
                nodeType:
                    config.stage === 'prod' ? 'dax.r5.large' : 'dax.t3.small',
                replicationFactor: 3,
                iamRoleArn: daxRole.roleArn,
                subnetGroupName: subnetGroup.subnetGroupName,
                securityGroupIds: [daxSecurityGroup.securityGroupId],
                clusterEndpointEncryptionType: 'NONE',
                parameterGroupName: daxParamterGroup.parameterGroupName,
                preferredMaintenanceWindow: 'sun:01:00-sun:09:00',
                sseSpecification: {
                    sseEnabled: false,
                },
            });
        }

        this.dataEntryTable = new dynamodb.Table(this, 'DataEntryTable', {
            tableName: `data-entry-${config.stage.toString()}`,
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'entryAt',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
            stream: dataWarehouseEnabled
                ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
                : undefined,
        });
        // Hack to override the logical ID of the table
        (this.dataEntryTable.node.defaultChild as CfnTable).overrideLogicalId(
            'DataEntryDatabaseDataEntryTable5F1DA5AC',
        );

        this.deviceTable = new dynamodb.Table(this, 'DeviceTable', {
            tableName: `device-${config.stage.toString()}`,
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'deviceToken',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            timeToLiveAttribute: 'expiresAt',
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
        });
        this.deviceTable.addGlobalSecondaryIndex({
            indexName: 'platformEndpointArnToDeviceIndex',
            partitionKey: {
                name: 'platformEndpointArn',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // Hack to override the logical ID of the table
        (this.deviceTable.node.defaultChild as CfnTable).overrideLogicalId(
            'DeviceDeviceTable44BDA3C1',
        );

        this.guardianTable = new dynamodb.Table(this, 'GuardianTable', {
            tableName: `guardian-${config.stage.toString()}`,
            partitionKey: {
                name: 'guardianEmail',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'userEmail',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
            stream: dataWarehouseEnabled
                ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
                : undefined,
        });
        this.guardianTable.addGlobalSecondaryIndex({
            indexName: 'userToGuardianIndex',
            partitionKey: {
                name: 'userEmail',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'guardianEmail',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // Hack to override the logical ID of the table
        (this.guardianTable.node.defaultChild as CfnTable).overrideLogicalId(
            'GuardianDatabaseGuardianTable96112C63',
        );

        this.leaderboardTable = new dynamodb.Table(this, 'LeaderboardTable', {
            tableName: `leaderboard-${config.stage.toString()}`,
            partitionKey: {
                name: 'gameId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
            stream: dataWarehouseEnabled
                ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
                : undefined,
        });
        this.leaderboardTable.addLocalSecondaryIndex({
            indexName: 'gameIdToScoreIndex',
            sortKey: {
                name: 'score',
                type: dynamodb.AttributeType.NUMBER,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // Hack to override the logical ID of the table
        (this.leaderboardTable.node.defaultChild as CfnTable).overrideLogicalId(
            'LeaderboardDatabaseLeaderboardTableA6064694',
        );

        this.missionTable = new dynamodb.Table(this, 'MissionTable', {
            tableName: `mission-${config.stage.toString()}`,
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'missionAt',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
            stream: dataWarehouseEnabled
                ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
                : undefined,
        });
        // Hack to override the logical ID of the table
        (this.missionTable.node.defaultChild as CfnTable).overrideLogicalId(
            'MissionDatabaseMissionTableE5A3B8CE',
        );

        this.storeTable = new dynamodb.Table(this, 'StoreTable', {
            tableName: `store-${config.stage.toString()}`,
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'itemId',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
            stream: dataWarehouseEnabled
                ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
                : undefined,
        });
        // Hack to override the logical ID of the table
        (this.storeTable.node.defaultChild as CfnTable).overrideLogicalId(
            'StoreDatabaseStoreTableF063B154',
        );

        this.streakTable = new dynamodb.Table(this, 'StreakTable', {
            tableName: `streak-${config.stage.toString()}`,
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'visitedAt',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
            stream: dataWarehouseEnabled
                ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
                : undefined,
        });
        // Hack to override the logical ID of the table
        (this.streakTable.node.defaultChild as CfnTable).overrideLogicalId(
            'StreakDatabaseStreakTable79889BAC',
        );

        this.subscriptionTable = new dynamodb.Table(this, 'SubscriptionTable', {
            tableName: `subscription-${config.stage.toString()}`,
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
            stream: dataWarehouseEnabled
                ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
                : undefined,
        });
        this.subscriptionTable.addGlobalSecondaryIndex({
            indexName: 'txIdToEmailIndex',
            partitionKey: {
                name: 'txId',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // Hack to override the logical ID of the table
        (
            this.subscriptionTable.node.defaultChild as CfnTable
        ).overrideLogicalId('SubscriptionDatabaseSubscriptionTable904091E8');

        this.quizTable = new dynamodb.Table(this, 'QuizTable', {
            tableName: `quiz-${config.stage.toString()}`,
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'quizId',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
            stream: dataWarehouseEnabled
                ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
                : undefined,
        });
        // Hack to override the logical ID of the table
        (this.quizTable.node.defaultChild as CfnTable).overrideLogicalId(
            'QuizDatabaseQuizTable607D502A',
        );

        this.userTable = new dynamodb.Table(this, 'UserTable', {
            tableName: `user-${config.stage.toString()}`,
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
            stream: dataWarehouseEnabled
                ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
                : undefined,
        });
        // Hack to override the logical ID of the table
        (this.userTable.node.defaultChild as CfnTable).overrideLogicalId(
            'UserDatabaseUserTable2651CE84',
        );

        this.userSessionTable = new dynamodb.Table(this, 'UserSessionTable', {
            tableName: `user-session-${config.stage.toString()}`,
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'type',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
        });
        this.userSessionTable.addGlobalSecondaryIndex({
            indexName: 'userIdToEmailIndex',
            partitionKey: {
                name: 'userId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // Hack to override the logical ID of the table
        (this.userSessionTable.node.defaultChild as CfnTable).overrideLogicalId(
            'UserSessionUserSessionTableC7B29056',
        );

        this.patientTable = new dynamodb.Table(this, 'PatientTable', {
            tableName: `patient-${config.stage.toString()}`,
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
            stream: dataWarehouseEnabled
                ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
                : undefined,
        });
        this.patientTable.addGlobalSecondaryIndex({
            indexName: 'patientIdIndex',
            partitionKey: {
                name: 'patientId',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        this.chatTable = new dynamodb.Table(this, 'ChatTable', {
            tableName: `chat-${config.stage.toString()}`,
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'entryAt',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
            stream: dataWarehouseEnabled
                ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
                : undefined,
        });

        this.referralTable = new dynamodb.Table(this, 'ReferralTable', {
            tableName: `referral-${config.stage.toString()}`,
            partitionKey: {
                name: 'referringEmail',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'referredEmail',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
        });

        this.dexcomEgvTable = new dynamodb.Table(this, 'DexcomEgvTable', {
            tableName: `dexcom-egv-${config.stage.toString()}`,
            partitionKey: {
                name: 'userId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'systemTime',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
            stream: dataWarehouseEnabled
                ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
                : undefined,
        });

        if (dataWarehouseEnabled) {
            // add a security group for the dax cluster
            const redshiftSecurityGroup = new SecurityGroup(
                this,
                'RedshiftSG',
                {
                    vpc: vpc,
                    description:
                        'SecurityGroup associated with the Redshift Cluster',
                    allowAllOutbound: true,
                    securityGroupName: `redshift-vpc-sg-${config.stage}`,
                },
            );
            const redshiftRole = new Role(this, 'RedshiftRole', {
                assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
                managedPolicies: [
                    ManagedPolicy.fromAwsManagedPolicyName(
                        'AmazonRedshiftAllCommandsFullAccess',
                    ),
                ],
            });

            const redshiftNamespace = new CfnNamespace(
                this,
                'RedshiftNamespace',
                {
                    namespaceName: `data-warehouse-ns-${config.stage}`,
                    manageAdminPassword: true,
                    iamRoles: [redshiftRole.roleArn],
                },
            );
        }
    }

    public getEnvs(): EnvironmentConfig {
        return {
            DATA_ENTRY_TABLE_NAME: this.dataEntryTable.tableName,
            DEVICE_TABLE_NAME: this.deviceTable.tableName,
            GUARDIAN_TABLE_NAME: this.guardianTable.tableName,
            LEADERBOARD_TABLE_NAME: this.leaderboardTable.tableName,
            MISSION_TABLE_NAME: this.missionTable.tableName,
            STORE_TABLE_NAME: this.storeTable.tableName,
            STREAK_TABLE_NAME: this.streakTable.tableName,
            SUBSCRIPTION_TABLE_NAME: this.subscriptionTable.tableName,
            QUIZ_TABLE_NAME: this.quizTable.tableName,
            USER_TABLE_NAME: this.userTable.tableName,
            USER_SESSION_TABLE_NAME: this.userSessionTable.tableName,
            PATIENT_TABLE_NAME: this.patientTable.tableName,
            CHAT_TABLE_NAME: this.chatTable.tableName,
            REFERRAL_TABLE_NAME: this.referralTable.tableName,
            DEXCOM_EGV_TABLE_NAME: this.dexcomEgvTable.tableName,
            DAX_CLUSTER_ENDPOINT: this.daxCluster
                ? this.daxCluster.attrClusterDiscoveryEndpoint
                : '',
        };
    }
}
