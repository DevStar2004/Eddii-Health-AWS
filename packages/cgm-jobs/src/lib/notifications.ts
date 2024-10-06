import { getGlucoseNotification } from '@eddii-backend/notifications';
import { AlertSettings, EgvsRecord } from '@eddii-backend/types';

export const getAlertName = (
    egvs: EgvsRecord,
    alertSettings: AlertSettings[],
): string | null => {
    const value = egvs.value;
    const trendRate = egvs.trendRate;
    const high = alertSettings.find(alert => alert.alertName === 'high');
    const urgentLow = alertSettings.find(
        alert => alert.alertName === 'urgentLow',
    );
    const urgentLowSoon = alertSettings.find(
        alert => alert.alertName === 'urgentLowSoon',
    );
    const low = alertSettings.find(alert => alert.alertName === 'low');
    const rise = alertSettings.find(alert => alert.alertName === 'rise');
    const fall = alertSettings.find(alert => alert.alertName === 'fall');
    //const noReadings = alertSettings.find(
    //    alert => alert.alertName === 'noReadings',
    //);
    if (high?.enabled && value > high?.value) {
        return 'high';
    } else if (urgentLow?.enabled && value < urgentLow?.value) {
        return 'urgentLow';
    } else if (urgentLowSoon?.enabled && value < urgentLowSoon?.value) {
        return 'urgentLowSoon';
    } else if (low?.enabled && value < low?.value) {
        return 'low';
    } else if (
        trendRate !== undefined &&
        rise?.enabled &&
        rise.value < trendRate
    ) {
        return 'rise';
    } else if (
        trendRate !== undefined &&
        fall?.enabled &&
        fall.value < -1 * trendRate
    ) {
        return 'fall';
    } // else if (noReadings?.enabled) {
    //    return 'noReadings';
    //}
    return null;
};

const getTrendArrow = (trend: string): string | undefined => {
    if (trend === 'singleUp') return '\u2191';
    else if (trend === 'doubleUp') return '\u219F';
    else if (trend === 'singleDown') return '\u2193';
    else if (trend === 'doubleDown') return '\u21A1';
    else if (trend === 'flat') return '\u2192';
    else if (trend === 'fortyFiveUp') return '\u2197';
    else if (trend === 'fortyFiveDown') return '\u2198';
    else if (trend === 'notComputable') return undefined;
    else return undefined;
};

const getNotificationTitle = (
    title: string,
    arrow?: string,
    value?: number,
): string => {
    let notificationTitle = title;
    if (arrow && value) {
        notificationTitle = `${value} ${arrow} ${title}`;
    }
    return notificationTitle;
};

export const getNotification = (
    alertName: string,
    egv?: EgvsRecord,
): { title: string; message: string } | undefined => {
    let title: string | undefined = undefined;
    let arrow = undefined;

    if (egv?.trend) {
        arrow = getTrendArrow(egv?.trend);
    }
    if (alertName === 'high') {
        title = getNotificationTitle('High Glucose Alert', arrow, egv?.value);
    } else if (alertName === 'urgentLow') {
        title = getNotificationTitle(
            'Urgent Low Glucose Alert',
            arrow,
            egv?.value,
        );
    } else if (alertName === 'urgentLowSoon') {
        title = 'Your EGV will be below your URGENT low limit soon';
    } else if (alertName === 'low') {
        title = getNotificationTitle('Low Glucose Alert', arrow, egv?.value);
    } else if (alertName === 'rise') {
        title = getNotificationTitle('Rising Glucose Alert', arrow, egv?.value);
    } else if (alertName === 'fall') {
        title = getNotificationTitle(
            'Falling Glucose Alert',
            arrow,
            egv?.value,
        );
    } else if (alertName === 'noReadings') {
        title =
            'Signal Loss. You will not receive alert, alarms or sensor glucose readings. Check Dexcom connection.';
    }
    const body = getGlucoseNotification(alertName);
    if (!title || !body) {
        return undefined;
    }

    return { title: title, message: body };
};
