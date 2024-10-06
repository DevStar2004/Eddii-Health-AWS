import { AlertSettings } from '@eddii-backend/types';
import { getAlertName, getNotification } from './notifications';

describe('getAlertName', () => {
    const alertSettings: AlertSettings[] = [
        { alertName: 'high', enabled: true, value: 120 },
        { alertName: 'low', enabled: true, value: 80 },
        { alertName: 'urgentLow', enabled: true, value: 55 },
        { alertName: 'urgentLowSoon', enabled: true, value: 58 },
        { alertName: 'rise', enabled: true, value: 2 },
        { alertName: 'fall', enabled: true, value: 2 },
    ];
    it('should return "high" when value is greater than high alert value', () => {
        const egvs: any = { value: 150, trendRate: 0.5 };
        const result = getAlertName(egvs, alertSettings);
        expect(result).toEqual('high');
    });

    it('should return "low" when value is less than low alert value', () => {
        const egvs: any = { value: 70, trendRate: 0.5 };
        const result = getAlertName(egvs, alertSettings);
        expect(result).toEqual('low');
    });

    it('should return "urgentLow" when value is less than urgentLow alert value', () => {
        const egvs: any = { value: 54, trendRate: 0.5 };
        const result = getAlertName(egvs, alertSettings);
        expect(result).toEqual('urgentLow');
    });

    it('should return "urgentLowSoon" when value is less than urgentLowSoon alert value', () => {
        const egvs: any = { value: 56, trendRate: 0.5 };
        const result = getAlertName(egvs, alertSettings);
        expect(result).toEqual('urgentLowSoon');
    });

    it('should return "rise" when trend is higher than rise alert value', () => {
        const egvs: any = { value: 90, trendRate: 2.5 };
        const result = getAlertName(egvs, alertSettings);
        expect(result).toEqual('rise');
    });

    it('should return "fall" when trend is higher than fall alert value', () => {
        const egvs: any = { value: 90, trendRate: -2.5 };
        const result = getAlertName(egvs, alertSettings);
        expect(result).toEqual('fall');
    });

    it('should return null when no alert is triggered', () => {
        const egvs: any = { value: 100, trendRate: 0.5 };
        const result = getAlertName(egvs, alertSettings);
        expect(result).toBeNull();
    });
});

describe('getNotification', () => {
    it('returns null for invalid alert names', () => {
        expect(getNotification('invalid')).toBeUndefined();
    });

    it('returns a notification object for valid alert names', () => {
        const alertNames = [
            'high',
            'urgentLow',
            'urgentLowSoon',
            'low',
            'rise',
            'fall',
            'noReadings',
        ];
        alertNames.forEach(alertName => {
            const notification = getNotification(alertName);
            expect(notification).not.toBeNull();
            expect(notification.title).not.toBe('');
            expect(notification.message).not.toBe('');
        });
    });
});
