// גשר חיפוש — מאפשר ל-CommandPalette להעביר query ל-OfficeSearch/LabSearch
let _pending = '';
export const setSearchBridge = (q) => { _pending = q; };
export const consumeSearchBridge = () => { const q = _pending; _pending = ''; return q; };
