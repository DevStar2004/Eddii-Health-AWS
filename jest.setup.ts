jest.mock('@eddii-backend/clients', () => {
    const dynamo = {
        get: jest.fn().mockReturnValue({ promise: jest.fn() }),
        put: jest.fn().mockReturnValue({ promise: jest.fn() }),
        delete: jest.fn().mockReturnValue({ promise: jest.fn() }),
        update: jest.fn().mockReturnValue({ promise: jest.fn() }),
        query: jest.fn().mockReturnValue({ promise: jest.fn() }),
        scan: jest.fn().mockReturnValue({ promise: jest.fn() }),
        batchGet: jest.fn().mockReturnValue({ promise: jest.fn() }),
        batchWrite: jest.fn().mockReturnValue({ promise: jest.fn() }),
        transactGet: jest.fn().mockReturnValue({ promise: jest.fn() }),
        transactWrite: jest.fn().mockReturnValue({ promise: jest.fn() }),
        createSet: (params: any) => jest.fn().mockReturnValue(new Set(params)),
    };
    const mockRedisClient = {
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue(undefined),
        set: jest.fn().mockResolvedValue(undefined),
        isReady: true,
        // ... add other methods you want to mock
    };
    const mockLaunchDarklyClient = {
        initialized: jest.fn().mockReturnValue(true),
        boolVariation: jest.fn(),
        variation: jest.fn(),
    };
    const mock = {
        dynamo: dynamo,
        dax: dynamo,
        secretsManager: {
            send: jest.fn(),
        },
        sns: {
            send: jest.fn(),
        },
        sqs: {
            send: jest.fn(),
        },
        pinpoint: {
            send: jest.fn(),
        },
        ses: {
            send: jest.fn(),
        },
        kinesis: {
            send: jest.fn(),
        },
        cognito: {
            listUsers: jest.fn(),
            adminDisableUser: jest.fn(),
            adminDeleteUser: jest.fn(),
        },
        scheduler: {
            send: jest.fn(),
        },
        lex: {
            send: jest.fn(),
        },
        bedrock: {
            send: jest.fn(),
        },
        getDexcomCache: jest.fn().mockResolvedValue(mockRedisClient),
        getLaunchDarkly: jest.fn().mockResolvedValue(mockLaunchDarklyClient),
    };
    return {
        ...mock,
        default: mock,
    };
});

beforeEach(() => {
    jest.clearAllMocks();
});
