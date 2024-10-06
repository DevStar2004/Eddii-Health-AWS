import { StoreItem } from '../store/store-model';

export const INITIAL_HEARTS = 20;
export const HEARTS_PER_DAY_LIMIT = 500;

export class User {
    public email: string;
    public hearts: number;
    public lifetimeHearts: number;
    public dailyHeartsLimit: number;
    public dailyHeartsLimitDate: string;
    public eddiiEquippedItems: { [slot: string]: StoreItem | string };
    public userTopicArn?: string;
    public createdAt: string;
    public updatedAt: string;
    public nickname?: string;
    public locale?: string;
    public zoneinfo?: string;
    public ageRange?: string;
    public birthday?: string;
    public diabetesInfo?: string;
    public avatar?: string;
    public glucoseAlerts: boolean;
    public dailyAlerts: boolean;
    public phoneNumber?: string;
    public badges?: string[];
    lowGlucoseAlertThreshold?: number;
    highGlucoseAlertThreshold?: number;

    constructor(
        email: string,
        nickname?: string,
        locale?: string,
        zoneinfo?: string,
    ) {
        const now = new Date().toISOString();
        this.email = email;
        this.nickname = nickname;
        this.locale = locale;
        this.zoneinfo = zoneinfo;
        this.hearts = INITIAL_HEARTS;
        this.lifetimeHearts = INITIAL_HEARTS;
        this.dailyHeartsLimit = HEARTS_PER_DAY_LIMIT;
        this.dailyHeartsLimitDate = now.split('T')[0];
        this.eddiiEquippedItems = {};
        this.glucoseAlerts = true;
        this.dailyAlerts = true;
        this.badges = [];
        this.createdAt = now;
        this.updatedAt = now;
    }
}
