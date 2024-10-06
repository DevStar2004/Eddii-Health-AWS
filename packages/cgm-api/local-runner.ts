/**
 * This is used to help run the lambda locally.
 */

import path from 'path';
import express from 'express';
import { execute } from 'lambda-local';

const app = express();

app.use(
    (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
    ): void => {
        express.json()(req, res, next);
    },
);

console.log('Starting Local API Server');
app.use(
    '/cgm-api',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        const result = await execute({
            lambdaPath: path.join(__dirname, '../main'),
            lambdaHandler: 'handler',
            event: {
                httpMethod: req.method,
                path: `/${req.originalUrl.split('/').slice(2).join('/')}`,
                headers: req.headers, // Pass on request headers
                body: req.body, // Pass on request body
                queryStringParameters: req.query,
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res.status((result as any).statusCode)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .set((result as any).headers)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .end((result as any).body);
    },
);

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/cgm-api`);
});
server.on('error', console.error);
