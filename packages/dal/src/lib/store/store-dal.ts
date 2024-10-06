import { getDynamoClient } from '../../aws';
// We don't need this in a DB for now.
import {
    ItemBundle,
    PurchasedItem,
    Slot,
    StoreInventoryByItemId,
    StoreItem,
} from './store-model';

const APP_ASSETS_DISTRIBUTION_URL = `https://${process.env['ASSETS_DISTRIBUTION_DOMAIN_NAME']}/app`;

const SALE_RANGE = {
    start:
        process.env['ENV'] === 'prod'
            ? new Date('2024-01-10T17:00:00.000Z')
            : new Date('2024-01-09T17:00:00.000Z'),
    end: new Date('2024-02-10T17:00:00.000Z'),
    discount: 0.1,
};

const items: StoreItem[] = [
    {
        name: 'yellow-sneakers',
        itemBundle: ItemBundle.clothes,
        cost: 20,
        slot: Slot.eddiiShoe,
        maxQuantity: 1,
        //assetUrl not needed as it is in the eddii animation itself.
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/yellow-sneakers/preview.svg`,
    },
    {
        name: 'blue-sneakers',
        itemBundle: ItemBundle.clothes,
        cost: 20,
        slot: Slot.eddiiShoe,
        maxQuantity: 1,
        //assetUrl not needed as it is in the eddii animation itself.
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/blue-sneakers/preview.svg`,
    },
    {
        name: 'pink-sneakers',
        itemBundle: ItemBundle.clothes,
        cost: 20,
        slot: Slot.eddiiShoe,
        maxQuantity: 1,
        //assetUrl not needed as it is in the eddii animation itself.
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/pink-sneakers/preview.svg`,
    },
    {
        name: 'red-bow-tie',
        itemBundle: ItemBundle.clothes,
        cost: 20,
        slot: Slot.eddiiNeck,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/red-bow-tie/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/red-bow-tie/preview.svg`,
    },
    {
        name: 'pink-bow-tie',
        itemBundle: ItemBundle.clothes,
        cost: 20,
        slot: Slot.eddiiNeck,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/pink-bow-tie/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/pink-bow-tie/preview.svg`,
    },
    {
        name: 'blue-bow-tie',
        itemBundle: ItemBundle.clothes,
        cost: 20,
        slot: Slot.eddiiNeck,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/blue-bow-tie/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/blue-bow-tie/preview.svg`,
    },
    {
        name: 'rainbow',
        itemBundle: ItemBundle.assets,
        cost: 20,
        slot: Slot.eddiiBottomLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/rainbow/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/rainbow/preview.svg`,
    },
    {
        name: 'lady-bug',
        itemBundle: ItemBundle.assets,
        cost: 20,
        slot: Slot.eddiiBottomRight,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/lady-bug/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/lady-bug/preview.svg`,
    },
    {
        name: 'sun',
        itemBundle: ItemBundle.assets,
        cost: 20,
        slot: Slot.eddiiTopLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/sun/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/sun/preview.svg`,
    },
    {
        name: 'navy-blue',
        itemBundle: ItemBundle.eddiiColors,
        cost: 40,
        slot: Slot.eddiiColor,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/navy-blue`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/navy-blue/preview.png`,
    },
    {
        name: 'original',
        itemBundle: ItemBundle.eddiiColors,
        cost: 0,
        slot: Slot.eddiiColor,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/original`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/original/preview.png`,
    },
    {
        name: 'blue',
        itemBundle: ItemBundle.meters,
        cost: 10,
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/blue`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/blue/preview.png`,
    },
    {
        name: 'green',
        itemBundle: ItemBundle.meters,
        cost: 10,
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/green`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/green/preview.png`,
    },
    {
        name: 'lady-bug',
        itemBundle: ItemBundle.meters,
        cost: 10,
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/lady-bug`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/lady-bug/preview.png`,
    },
    {
        name: 'pink',
        itemBundle: ItemBundle.meters,
        cost: 10,
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/pink`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/pink/preview.png`,
    },
    {
        name: 'silver',
        itemBundle: ItemBundle.meters,
        cost: 10,
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/silver`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/silver/preview.png`,
    },
    {
        name: 'wood',
        itemBundle: ItemBundle.meters,
        cost: 10,
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/wood`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/wood/preview.png`,
    },
    {
        name: 'beach',
        itemBundle: ItemBundle.backgrounds,
        cost: 15,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/beach/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/beach/preview.svg`,
    },
    {
        name: 'forest',
        itemBundle: ItemBundle.backgrounds,
        cost: 15,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/forest/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/forest/preview.svg`,
    },
    {
        name: 'mountain',
        itemBundle: ItemBundle.backgrounds,
        cost: 15,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/mountain/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/mountain/preview.svg`,
    },
    {
        name: 'red',
        itemBundle: ItemBundle.eddiiColors,
        cost: 40,
        slot: Slot.eddiiColor,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/red`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/red/preview.png`,
    },
    {
        name: 'yellow',
        itemBundle: ItemBundle.eddiiColors,
        cost: 40,
        slot: Slot.eddiiColor,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/yellow`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/yellow/preview.png`,
    },
    {
        name: 'butterfly',
        itemBundle: ItemBundle.assets,
        cost: 15,
        slot: Slot.eddiiLeftHand,
        maxQuantity: 1,
        //assetUrl not needed as it is in the eddii animation itself.
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/butterfly/preview.svg`,
    },
    {
        name: 'baseball',
        itemBundle: ItemBundle.assets,
        cost: 15,
        slot: Slot.eddiiLeftHand,
        maxQuantity: 1,
        //assetUrl not needed as it is in the eddii animation itself.
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/baseball/preview.svg`,
    },
    {
        name: 'beetle',
        itemBundle: ItemBundle.assets,
        cost: 15,
        slot: Slot.eddiiLeftHand,
        maxQuantity: 1,
        //assetUrl not needed as it is in the eddii animation itself.
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/beetle/preview.svg`,
    },
    {
        name: 'skateboard',
        itemBundle: ItemBundle.assets,
        cost: 20,
        slot: Slot.eddiiBottomRight,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/skateboard/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/skateboard/preview.svg`,
    },
    {
        name: 'easter-egg',
        itemBundle: ItemBundle.assets,
        cost: 15,
        slot: Slot.eddiiBottomRight,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/easter-egg/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/easter-egg/preview.svg`,
    },
    {
        name: 'puppy',
        itemBundle: ItemBundle.eddiiPals,
        cost: 40,
        slot: Slot.eddiiFarLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/puppy/puppy.json`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/puppy/preview.svg`,
    },
    {
        name: 'space',
        itemBundle: ItemBundle.backgrounds,
        cost: 15,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/space/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/space/preview.svg`,
    },
    {
        name: 'kid-room',
        itemBundle: ItemBundle.backgrounds,
        cost: 15,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/kid-room/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/kid-room/preview.svg`,
    },
    {
        name: 'blue-gradient',
        itemBundle: ItemBundle.backgrounds,
        cost: 15,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/blue-gradient/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/blue-gradient/preview.svg`,
    },
    {
        name: 'red-gradient',
        itemBundle: ItemBundle.backgrounds,
        cost: 15,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/red-gradient/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/red-gradient/preview.svg`,
    },
    {
        name: 'yellow-gradient',
        itemBundle: ItemBundle.backgrounds,
        cost: 15,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/yellow-gradient/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/yellow-gradient/preview.svg`,
    },
    {
        name: 'purple',
        itemBundle: ItemBundle.eddiiColors,
        cost: 40,
        slot: Slot.eddiiColor,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/purple`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/purple/preview.png`,
    },
    {
        name: 'light-blue',
        itemBundle: ItemBundle.eddiiColors,
        cost: 40,
        slot: Slot.eddiiColor,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/light-blue`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/light-blue/preview.png`,
    },
    {
        name: 'beach',
        itemBundle: ItemBundle.meters,
        cost: 10,
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/beach`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/beach/preview.png`,
    },
    {
        name: 'skin',
        itemBundle: ItemBundle.meters,
        cost: 10,
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/skin`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/skin/preview.png`,
    },
    {
        name: 'water',
        itemBundle: ItemBundle.meters,
        cost: 10,
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/water`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/water/preview.png`,
    },
    {
        name: 'blue-abstract',
        itemBundle: ItemBundle.backgrounds,
        cost: 20,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/blue-abstract/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/blue-abstract/preview.svg`,
    },
    {
        name: 'pink-abstract',
        itemBundle: ItemBundle.backgrounds,
        cost: 20,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/pink-abstract/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/pink-abstract/preview.svg`,
    },
    {
        name: 'amusement-park',
        itemBundle: ItemBundle.backgrounds,
        cost: 20,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/amusement-park/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/amusement-park/preview.svg`,
    },
    {
        name: 'city',
        itemBundle: ItemBundle.backgrounds,
        cost: 20,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/city/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/city/preview.svg`,
    },
    {
        name: 'moon',
        itemBundle: ItemBundle.backgrounds,
        cost: 20,
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/moon/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/moon/preview.svg`,
    },
    {
        cost: 15,
        itemBundle: ItemBundle.backgrounds,
        name: 'halloween',
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/halloween/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/halloween/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.eddiiPals,
        name: 'ghost',
        slot: Slot.eddiiFarLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/ghost/ghost.json`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/ghost/preview.svg`,
    },
    {
        cost: 10,
        itemBundle: ItemBundle.meters,
        name: 'halloween',
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/halloween`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/halloween/preview.png`,
    },
    {
        cost: 20,
        itemBundle: ItemBundle.assets,
        name: 'pumpkin',
        slot: Slot.eddiiBottomRight,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/pumpkin/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/pumpkin/preview.svg`,
    },
    {
        cost: 20,
        itemBundle: ItemBundle.assets,
        name: 'candies',
        slot: Slot.eddiiBottomLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/candies/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/candies/preview.svg`,
    },
    {
        cost: 15,
        itemBundle: ItemBundle.backgrounds,
        name: 'thanksgiving',
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/thanksgiving/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/thanksgiving/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.eddiiPals,
        name: 'turkey',
        slot: Slot.eddiiFarLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/turkey/turkey.json`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/turkey/preview.svg`,
    },
    {
        cost: 10,
        itemBundle: ItemBundle.meters,
        name: 'thanksgiving',
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/thanksgiving`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/thanksgiving/preview.png`,
    },
    {
        cost: 20,
        itemBundle: ItemBundle.assets,
        name: 'cornucopia',
        slot: Slot.eddiiBottomLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/cornucopia/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/cornucopia/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.eddiiColors,
        name: 'thanksgiving',
        slot: Slot.eddiiColor,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/thanksgiving`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/thanksgiving/preview.png`,
    },
    {
        cost: 20,
        itemBundle: ItemBundle.assets,
        name: 'mat',
        slot: Slot.eddiiCenter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/mat/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/mat/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-1',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-1/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-1/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-2',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-2/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-2/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-3',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-3/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-3/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-4',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-4/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-4/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-5',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-5/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-5/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-6',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-6/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-6/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-7',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-7/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-7/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-8',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-8/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-8/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-9',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-9/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-9/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-10',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-10/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-10/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-11',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-11/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-11/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-12',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-12/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-12/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-13',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-13/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-13/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-14',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-14/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-14/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-15',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-15/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-15/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'cyberCrew-16',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-16/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/cyber-crew-16/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-1',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-1/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-1/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-2',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-2/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-2/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-3',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-3/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-3/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-4',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-4/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-4/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-5',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-5/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-5/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-6',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-6/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-6/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-7',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-7/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-7/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-8',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-8/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-8/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-9',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-9/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-9/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-10',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-10/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-10/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-11',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-11/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-11/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-12',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-12/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-12/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-13',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-13/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-13/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-14',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-14/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-14/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-15',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-15/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-15/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-16',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-16/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-16/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-17',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-17/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-17/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-18',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-18/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-18/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-19',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-19/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-19/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.avatars,
        name: 'junglePals-20',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-20/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/jungle-pals-20/preview.svg`,
    },
    {
        cost: 150,
        itemBundle: ItemBundle.bonuses,
        name: 'fire-master',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/fire-master/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/fire-master/preview.svg`,
        unlockCondition: {
            streak: 3,
        },
    },
    {
        cost: 150,
        itemBundle: ItemBundle.bonuses,
        name: 'star-coin',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/star-coin/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/star-coin/preview.svg`,
        unlockCondition: {
            streak: 3,
        },
    },
    {
        cost: 250,
        itemBundle: ItemBundle.bonuses,
        name: 'vip',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/vip/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/vip/preview.svg`,
        unlockCondition: {
            streak: 15,
        },
    },
    {
        cost: 250,
        itemBundle: ItemBundle.bonuses,
        name: 'stellar-achiever',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/stellar-achiever/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/stellar-achiever/preview.svg`,
        unlockCondition: {
            streak: 15,
        },
    },
    {
        cost: 150,
        itemBundle: ItemBundle.bonuses,
        name: 'ruby-royal',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/ruby-royal/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/ruby-royal/preview.svg`,
        unlockCondition: {
            streak: 30,
        },
    },
    {
        cost: 150,
        itemBundle: ItemBundle.bonuses,
        name: 'treasure-chest',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/treasure-chest/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/treasure-chest/preview.svg`,
        unlockCondition: {
            streak: 30,
        },
    },
    {
        cost: 250,
        itemBundle: ItemBundle.bonuses,
        name: 'prestigious',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/prestigious/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/prestigious/preview.svg`,
        unlockCondition: {
            streak: 45,
        },
    },
    {
        cost: 250,
        itemBundle: ItemBundle.bonuses,
        name: 'gem-of-glory',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/gem-of-glory/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/gem-of-glory/preview.svg`,
        unlockCondition: {
            streak: 45,
        },
    },
    {
        cost: 250,
        itemBundle: ItemBundle.bonuses,
        name: 'heart-of-gold',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/heart-of-gold/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/heart-of-gold/preview.svg`,
        unlockCondition: {
            streak: 60,
        },
    },
    {
        cost: 250,
        itemBundle: ItemBundle.bonuses,
        name: 'flame-warrior',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/flame-warrior/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/flame-warrior/preview.svg`,
        unlockCondition: {
            streak: 60,
        },
    },
    {
        cost: 150,
        itemBundle: ItemBundle.bonuses,
        name: 'scholar',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/scholar/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/scholar/preview.svg`,
        unlockCondition: {
            streak: 75,
        },
    },
    {
        cost: 150,
        itemBundle: ItemBundle.bonuses,
        name: 'heart-coin',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/heart-coin/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/heart-coin/preview.svg`,
        unlockCondition: {
            streak: 75,
        },
    },
    {
        cost: 250,
        itemBundle: ItemBundle.bonuses,
        name: 'mystery-coin',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/mystery-coin/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/mystery-coin/preview.svg`,
        unlockCondition: {
            streak: 90,
        },
    },
    {
        cost: 250,
        itemBundle: ItemBundle.bonuses,
        name: 'gold-jewel',
        slot: Slot.badge,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/gold-jewel/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/badges/gold-jewel/preview.svg`,
        unlockCondition: {
            streak: 90,
        },
    },
    {
        cost: 200,
        itemBundle: ItemBundle.bonuses,
        name: 'sciFi-1',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-1/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-1/preview.svg`,
        unlockCondition: {
            streak: 5,
        },
    },
    {
        cost: 200,
        itemBundle: ItemBundle.bonuses,
        name: 'sciFi-2',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-2/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-2/preview.svg`,
        unlockCondition: {
            streak: 5,
        },
    },
    {
        cost: 200,
        itemBundle: ItemBundle.bonuses,
        name: 'sciFi-3',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-3/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-3/preview.svg`,
        unlockCondition: {
            streak: 15,
        },
    },
    {
        cost: 200,
        itemBundle: ItemBundle.bonuses,
        name: 'sciFi-4',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-4/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-4/preview.svg`,
        unlockCondition: {
            streak: 15,
        },
    },
    {
        cost: 200,
        itemBundle: ItemBundle.bonuses,
        name: 'sciFi-5',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-5/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-5/preview.svg`,
        unlockCondition: {
            streak: 30,
        },
    },
    {
        cost: 200,
        itemBundle: ItemBundle.bonuses,
        name: 'sciFi-6',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-6/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-6/preview.svg`,
        unlockCondition: {
            streak: 30,
        },
    },
    {
        cost: 200,
        itemBundle: ItemBundle.bonuses,
        name: 'sciFi-7',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-7/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-7/preview.svg`,
        unlockCondition: {
            streak: 45,
        },
    },
    {
        cost: 200,
        itemBundle: ItemBundle.bonuses,
        name: 'sciFi-8',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-8/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-8/preview.svg`,
        unlockCondition: {
            streak: 45,
        },
    },
    {
        cost: 200,
        itemBundle: ItemBundle.bonuses,
        name: 'sciFi-9',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-9/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-9/preview.svg`,
        unlockCondition: {
            streak: 60,
        },
    },
    {
        cost: 200,
        itemBundle: ItemBundle.bonuses,
        name: 'sciFi-10',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-10/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-10/preview.svg`,
        unlockCondition: {
            streak: 60,
        },
    },
    {
        cost: 200,
        itemBundle: ItemBundle.bonuses,
        name: 'sciFi-11',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-11/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-11/preview.svg`,
        unlockCondition: {
            streak: 75,
        },
    },
    {
        cost: 200,
        itemBundle: ItemBundle.bonuses,
        name: 'sciFi-12',
        slot: Slot.avatar,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-12/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/avatars/sci-fi-12/preview.svg`,
        unlockCondition: {
            streak: 75,
        },
    },
    {
        cost: 500,
        itemBundle: ItemBundle.giftCards,
        name: 'roblox',
        slot: Slot.giftCard,
        maxQuantity: 1000,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/gift-cards/roblox/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/gift-cards/roblox/preview.svg`,
        filterFromInventory: true,
    },
    {
        cost: 15,
        itemBundle: ItemBundle.backgrounds,
        name: 'christmas',
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/christmas/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/christmas/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.eddiiPals,
        name: 'snowman',
        slot: Slot.eddiiFarLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/snowman/snowman.json`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/snowman/preview.svg`,
    },
    {
        cost: 10,
        itemBundle: ItemBundle.meters,
        name: 'christmas',
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/christmas`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/christmas/preview.png`,
    },
    {
        cost: 20,
        itemBundle: ItemBundle.assets,
        name: 'sled',
        slot: Slot.eddiiBottomRight,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/sled/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/sled/preview.svg`,
    },
    {
        name: 'mittens',
        itemBundle: ItemBundle.assets,
        cost: 15,
        slot: Slot.eddiiLeftHand,
        maxQuantity: 1,
        //assetUrl not needed as it is in the eddii animation itself.
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/mittens/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.eddiiColors,
        name: 'christmas',
        slot: Slot.eddiiColor,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/christmas`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/christmas/preview.png`,
    },
    {
        cost: 15,
        itemBundle: ItemBundle.backgrounds,
        name: 'christmas-inside',
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/christmas-inside/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/christmas-inside/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.eddiiPals,
        name: 'sunflower',
        slot: Slot.eddiiFarLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/sunflower/sunflower.json`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/sunflower/preview.svg`,
    },
    {
        cost: 10,
        itemBundle: ItemBundle.meters,
        name: 'christmas-inside',
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/christmas-inside`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/christmas-inside/preview.png`,
    },
    {
        cost: 20,
        itemBundle: ItemBundle.assets,
        name: 'cookies',
        slot: Slot.eddiiBottomRight,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/cookies/bg.json`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/cookies/preview.svg`,
    },
    {
        cost: 20,
        itemBundle: ItemBundle.assets,
        name: 'fireplace',
        slot: Slot.eddiiTopRight,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/fireplace/bg.json`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/fireplace/preview.svg`,
    },
    {
        cost: 20,
        itemBundle: ItemBundle.assets,
        name: 'tree',
        slot: Slot.eddiiTopLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/tree/bg.json`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/tree/preview.svg`,
    },
    //{
    //    cost: 0,
    //    itemBundle: ItemBundle.christmas,
    //    name: 'gifts',
    //    slot: Slot.eddiiBottomLeft,
    //    maxQuantity: 1,
    //    assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/gifts/bg.svg`,
    //    previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/gifts/preview.svg`,
    //},
    {
        cost: 15,
        itemBundle: ItemBundle.backgrounds,
        name: 'new-year',
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/new-year/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/new-year/preview.svg`,
    },
    {
        cost: 10,
        itemBundle: ItemBundle.meters,
        name: 'new-year',
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/new-year`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/new-year/preview.png`,
    },
    {
        cost: 20,
        itemBundle: ItemBundle.assets,
        name: 'new-year-24',
        slot: Slot.eddiiTopRight,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/new-year-24/bg.json`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/new-year-24/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.eddiiPals,
        name: 'maple-leaf',
        slot: Slot.eddiiFarLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/maple-leaf/maple-leaf.json`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/maple-leaf/preview.svg`,
    },
    {
        name: 'gold-bow-tie',
        itemBundle: ItemBundle.clothes,
        cost: 20,
        slot: Slot.eddiiNeck,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/gold-bow-tie/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/gold-bow-tie/preview.svg`,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.giftCardsTasks,
        name: 'gift-card-cgm-connection',
        itemDescription: 'CGM connection',
        slot: Slot.giftCardTask,
        maxQuantity: 1,
        unlockCondition: {
            cgmConnection: true,
        },
        filterFromInventory: true,
        disabled: true,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.giftCardsTasks,
        name: 'gift-card-cgm-connection-2-referrals',
        itemDescription: 'Refer 2 friends to the eddii app',
        slot: Slot.giftCardTask,
        maxQuantity: 3,
        unlockCondition: {
            cgmConnectionReferral: 2,
        },
        filterFromInventory: true,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.giftCardsTasks,
        name: 'gift-card-premium',
        itemDescription: 'Convert to eddii Premium',
        slot: Slot.giftCardTask,
        maxQuantity: 1,
        unlockCondition: {
            isPremium: true,
        },
        filterFromInventory: true,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.giftCardsTasks,
        name: 'gift-card-7-day-streak',
        itemDescription: 'Open app every day for 7 days',
        slot: Slot.giftCardTask,
        maxQuantity: 1,
        unlockCondition: {
            streak: 7,
        },
        filterFromInventory: true,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.giftCardsTasks,
        name: 'gift-card-15-day-streak',
        itemDescription: 'Open app every day for 15 days',
        slot: Slot.giftCardTask,
        maxQuantity: 1,
        unlockCondition: {
            streak: 15,
        },
        filterFromInventory: true,
    },
    {
        cost: 0,
        itemBundle: ItemBundle.giftCardsTasks,
        name: 'gift-card-30-day-streak',
        itemDescription: 'Open app every day for 30 days',
        slot: Slot.giftCardTask,
        maxQuantity: 1000,
        unlockCondition: {
            streak: 30,
        },
        filterFromInventory: true,
    },
    {
        cost: 5,
        itemBundle: ItemBundle.redeemableGiftCards,
        name: 'amazon-5',
        slot: Slot.redeemableGiftCard,
        maxQuantity: 1000,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/gift-cards/amazon/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/gift-cards/amazon/preview.svg`,
        filterFromInventory: true,
    },
    {
        cost: 5,
        itemBundle: ItemBundle.redeemableGiftCards,
        name: 'target-5',
        slot: Slot.redeemableGiftCard,
        maxQuantity: 1000,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/gift-cards/target/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/gift-cards/target/preview.svg`,
        filterFromInventory: true,
    },
    {
        cost: 5,
        itemBundle: ItemBundle.redeemableGiftCards,
        name: 'walmart-5',
        slot: Slot.redeemableGiftCard,
        maxQuantity: 1000,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/gift-cards/walmart/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/gift-cards/walmart/preview.svg`,
        filterFromInventory: true,
    },
    {
        cost: 10,
        itemBundle: ItemBundle.redeemableGiftCards,
        name: 'roblox-10',
        slot: Slot.redeemableGiftCard,
        maxQuantity: 1000,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/gift-cards/roblox/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/gift-cards/roblox/preview.svg`,
        filterFromInventory: true,
        unlockCondition: {
            daysSinceLastPurchase: 30,
        },
    },
    {
        cost: 15,
        itemBundle: ItemBundle.backgrounds,
        name: 'easter',
        slot: Slot.background,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/easter/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/backgrounds/easter/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.eddiiPals,
        name: 'carrots',
        slot: Slot.eddiiFarLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/carrots/carrots.json`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/pals-animations/carrots/preview.svg`,
    },
    {
        cost: 20,
        itemBundle: ItemBundle.assets,
        name: 'paint-bucket',
        slot: Slot.eddiiBottomRight,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/paint-bucket/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/paint-bucket/preview.svg`,
    },
    {
        name: 'egg-basket',
        itemBundle: ItemBundle.assets,
        cost: 20,
        slot: Slot.eddiiTopLeft,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/egg-basket/bg.svg`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/assets/egg-basket/preview.svg`,
    },
    {
        cost: 40,
        itemBundle: ItemBundle.eddiiColors,
        name: 'easter',
        slot: Slot.eddiiColor,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/easter`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii-animations/easter/preview.png`,
    },
    {
        cost: 10,
        itemBundle: ItemBundle.meters,
        name: 'easter',
        slot: Slot.meter,
        maxQuantity: 1,
        assetUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/easter`,
        previewUrl: `${APP_ASSETS_DISTRIBUTION_URL}/meters/easter/preview.png`,
    },
];

const storeInventoryByItemId: StoreInventoryByItemId = items
    .map(item => {
        const now = new Date();
        const isSaleActive = now >= SALE_RANGE.start && now <= SALE_RANGE.end;
        return isSaleActive
            ? { ...item, cost: Math.ceil(item.cost * SALE_RANGE.discount) }
            : item;
    })
    .reduce((acc, item) => {
        acc[`${item.slot}/${item.name}`] = item;
        return acc;
    }, {} as StoreInventoryByItemId);

export const listStoreInventory = (): StoreItem[] => {
    return items.map(item => {
        const now = new Date();
        const isSaleActive = now >= SALE_RANGE.start && now <= SALE_RANGE.end;
        return isSaleActive
            ? { ...item, cost: Math.ceil(item.cost * SALE_RANGE.discount) }
            : item;
    });
};

export const getStoreItem = (
    itemName: string,
    itemSlot: Slot,
): StoreItem | undefined => {
    return storeInventoryByItemId[`${itemSlot}/${itemName}`];
};

export const purchaseItem = async (
    email: string,
    itemId: string,
    quantity = 1,
    redeemCount?: number,
    redeemedAt?: string,
): Promise<PurchasedItem> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    if (!itemId) {
        throw new Error('ItemId is required.');
    }
    const client = getDynamoClient();
    const purchasedItem: PurchasedItem = {
        email: email,
        itemId: itemId,
        quantity: quantity,
        purchasedAt: new Date().toISOString(),
        ...(redeemCount !== undefined ? { redeemCount } : {}),
        ...(redeemedAt !== undefined ? { redeemedAt } : {}),
    };
    const params = {
        TableName: process.env['STORE_TABLE_NAME'] as string,
        Item: purchasedItem,
    };
    try {
        await client.put(params).promise();
        return {
            ...purchasedItem,
            storeItem:
                itemId.split('/').length == 2
                    ? getStoreItem(
                          itemId.split('/')[1] as string,
                          itemId.split('/')[0] as Slot,
                      )
                    : undefined,
        };
    } catch (e) {
        console.error(`Failed to purchase item.`, e);
        throw new Error('Error purchasing item.');
    }
};

export const listPurchasedItems = async (
    email: string,
): Promise<PurchasedItem[]> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    console.log(`Getting purchased items by email ${email}`);
    const client = getDynamoClient({ skipCache: true });
    const params = {
        TableName: process.env['STORE_TABLE_NAME'] as string,
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': email,
        },
    };
    try {
        const result = await client.query(params).promise();
        if (result.Items && result.Items.length > 0) {
            const purchasedItems: PurchasedItem[] = [];
            for (const item of result.Items as PurchasedItem[]) {
                const storeItem = getStoreItem(
                    item.itemId.split('/')[1] as string,
                    item.itemId.split('/')[0] as Slot,
                );
                purchasedItems.push({
                    ...item,
                    storeItem: storeItem,
                });
            }
            return purchasedItems;
        } else {
            return [];
        }
    } catch (e) {
        console.error(`Failed to get purchased items`, e);
        throw new Error('Error getting purchased items.');
    }
};

export const listPurchasedItemsBySlot = async (
    email: string,
    itemSlot: string,
): Promise<PurchasedItem[]> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    console.log(
        `Getting purchased items by email ${email} and slot ${itemSlot}`,
    );
    const client = getDynamoClient({ skipCache: true });
    const params = {
        TableName: process.env['STORE_TABLE_NAME'] as string,
        KeyConditionExpression:
            'email = :email and begins_with(itemId, :itemSlot)',
        ExpressionAttributeValues: {
            ':email': email,
            ':itemSlot': itemSlot + '/',
        },
    };
    try {
        const result = await client.query(params).promise();
        if (result.Items && result.Items.length > 0) {
            const purchasedItems: PurchasedItem[] = [];
            for (const item of result.Items as PurchasedItem[]) {
                const storeItem = getStoreItem(
                    item.itemId.split('/')[1] as string,
                    item.itemId.split('/')[0] as Slot,
                );
                purchasedItems.push({
                    ...item,
                    storeItem: storeItem,
                });
            }
            return purchasedItems;
        } else {
            return [];
        }
    } catch (e) {
        console.error(`Failed to get purchased items by slot`, e);
        throw new Error('Error getting purchased items by slot.');
    }
};

export const getPurchasedItem = async (
    email: string,
    itemId: string,
): Promise<PurchasedItem | undefined> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    if (!itemId) {
        throw new Error('ItemId is required.');
    }
    console.log(`Checking if ${email} has purchased ${itemId}`);
    const client = getDynamoClient({ skipCache: true });
    const params = {
        TableName: process.env['STORE_TABLE_NAME'] as string,
        KeyConditionExpression: 'email = :email and itemId = :itemId',
        ExpressionAttributeValues: {
            ':email': email,
            ':itemId': itemId,
        },
    };
    try {
        const result = await client.query(params).promise();
        if (result.Items && result.Items.length > 0) {
            const item = result.Items[0] as PurchasedItem;
            return {
                ...item,
                storeItem:
                    item.itemId.split('/').length == 2
                        ? getStoreItem(
                              item.itemId.split('/')[1] as string,
                              item.itemId.split('/')[0] as Slot,
                          )
                        : undefined,
            };
        } else {
            return undefined;
        }
    } catch (e) {
        console.error(`Failed to check if ${email} has purchased ${itemId}`, e);
        throw new Error('Error checking if item has been purchased.');
    }
};

export const hasPurchasedItem = async (
    email: string,
    itemId: string,
): Promise<number> => {
    const purchasedItem = await getPurchasedItem(email, itemId);
    if (purchasedItem) {
        return purchasedItem.quantity;
    } else {
        return 0;
    }
};

export const redeemGiftCard = async (
    email: string,
    itemId: string,
): Promise<PurchasedItem> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    if (!itemId) {
        throw new Error('ItemId is required.');
    }
    console.log(`Redeeming gift card ${itemId} for ${email}`);
    const client = getDynamoClient();
    const params = {
        TableName: process.env['STORE_TABLE_NAME'] as string,
        Key: {
            email: email,
            itemId: itemId,
        },
        UpdateExpression:
            'SET redeemCount = if_not_exists(redeemCount, :zero) + :inc, redeemedAt = :date',
        ExpressionAttributeValues: {
            ':zero': 0,
            ':inc': 1,
            ':date': new Date().toISOString(),
        },
        ReturnValues: 'UPDATED_NEW',
    };
    try {
        const response = await client.update(params).promise();
        return response.Attributes as PurchasedItem;
    } catch (e) {
        console.error(`Failed to redeem gift card ${itemId} for ${email}`, e);
        throw new Error('Error redeeming gift card.');
    }
};
