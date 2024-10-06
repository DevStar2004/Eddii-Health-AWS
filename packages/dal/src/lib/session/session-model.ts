export enum SessionType {
    // eslint-disable-next-line no-unused-vars
    dexcom = 'dexcom',
}

export interface Session {
    email: string;
    userId?: string;
    type: SessionType;
}

export interface OAuthSession extends Session {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresAt: number;
}
