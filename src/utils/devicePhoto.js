// בודק אם למכשיר אין תמונה כלל — משמש לחסימת המעבדה (בלבד) עד השלמת תמונה
export const isDeviceMissingPhoto = (device) => !device?.images || device.images.length === 0;
