import createAPI, { Request, Response } from 'lambda-api';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
    listStoreInventory,
    getStoreItem,
    purchaseStoreItem,
    listPurchasedItems,
    listBonusItems,
    getPurchasedItem,
    redeemGiftCard,
    listGiftCardTasks,
    listRedeemableGiftCards,
    listAvailableGiftCards,
} from './lib/store';
import {
    CORS_DOMAIN_REGEX,
    validateAndNormalizeEmail,
} from '@eddii-backend/utils';
// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';

const api = createAPI({
    logger: {
        access: true,
        errorLogging: true,
        stack: true,
        timestamp: () => new Date().toISOString(),
    },
});

// CORS
api.use((req, res, next) => {
    // Return CORS headers
    if (CORS_DOMAIN_REGEX.test(req.headers.origin)) {
        res.cors({
            origin: req.headers.origin,
        });
    }
    next();
});

api.use((request: Request, response: Response, next: () => void) => {
    if (request.path === '/deep-ping') {
        next();
        return;
    }
    if (request.headers['app-version']) {
        request.appVersion = request.headers['app-version'];
    }
    if (
        request.requestContext.authorizer &&
        request.requestContext.authorizer.claims &&
        request.requestContext.authorizer.claims.email
    ) {
        const email = request.requestContext.authorizer.claims.email;
        const normalizedEmail = validateAndNormalizeEmail(email);
        if (!normalizedEmail) {
            response.status(401).json({ message: 'Not Authorized.' });
            return;
        }
        request.userEmail = normalizedEmail;
        next(); // continue execution
    } else {
        response.status(401).json({ message: 'Not Authorized.' });
    }
});

// Store Routes.
api.get('/store', listStoreInventory);
api.get('/store/:itemSlot/:itemName', getStoreItem);
api.post('/store/:itemSlot/:itemName', purchaseStoreItem);
api.get('/store/purchased', listPurchasedItems);
api.get('/store/purchased/:itemSlot/:itemName', getPurchasedItem);

// Bonuses Routes.
api.get('/store/bonuses', listBonusItems);

// Gift Card Routes.
api.post('/store/gift-card/:giftCardName', redeemGiftCard);
api.get('/store/gift-card-task', listGiftCardTasks);
api.get('/store/redeemable-gift-card', listRedeemableGiftCards);
api.get('/store/available-gift-card', listAvailableGiftCards);

// Ping Route.
api.get('/deep-ping', async () => {
    return { message: 'ping' };
});

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context,
) => {
    return await api.run(event, context);
};
