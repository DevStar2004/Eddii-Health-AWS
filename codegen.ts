import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    overwrite: true,
    schema: 'https://staging-api.gethealthie.com/graphql',
    generates: {
        'packages/healthie/__generated__/graphql.ts': {
            plugins: ['typescript'],
        },
    },
};

export default config;
