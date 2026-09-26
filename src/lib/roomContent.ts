// Local coordinates & descriptions of exam rooms, keyed by room ID.
export const ROOM_CONTENT: Record<string, { title?: string; description?: string; note?: string; lat?: number; lng?: number }> = {
  "CP.9127": {
    title: "ห้องสอบ CP.9127",
    description: "ชั้น 1 อาคารวิทยวิภาส วิทยาลัยการคอมพิวเตอร์",
    lat: 16.475664272450587,
    lng: 102.82516966718458,
  },
  "CP.9525": {
    title: "ห้องสอบ CP.9525",
    description: "ชั้น 5 อาคารวิทยวิภาส วิทยาลัยการคอมพิวเตอร์",
    lat: 16.475664272450587,
    lng: 102.82516966718458,
  },
  "CP.9527": {
    title: "ห้องสอบ CP.9527",
    description: "ชั้น 5 อาคารวิทยวิภาส วิทยาลัยการคอมพิวเตอร์",
    lat: 16.475664272450587,
    lng: 102.82516966718458,
  },
  "SC.1101": {
    title: "ห้องสอบ SC.1101",
    description: "ตึกกลม คณะวิทยาศาสตร์",
    lat: 16.475242318746584,
    lng: 102.82310162638832,
  },
  "SC.1102": {
    title: "ห้องสอบ SC.1102",
    description: "ตึกกลม คณะวิทยาศาสตร์",
    lat: 16.475242318746584,
    lng: 102.82310162638832,
  },
  "SC.1103": {
    title: "ห้องสอบ SC.1103",
    description: "ตึกกลม คณะวิทยาศาสตร์",
    lat: 16.475242318746584,
    lng: 102.82310162638832,
  },
  "SC.3201": {
    title: "ห้องสอบ SC.3201",
    description: "ชั้น 2 ภาควิชาชีววิทยา คณะวิทยาศาสตร์",
    lat: 16.476367129613752,
    lng: 102.82519934748095,
  },
  "SC.5101": {
    title: "ห้องสอบ SC.5101",
    description: "อาคารเรียนรวมวิทยาศาสตร์ คณะวิทยาศาสตร์",
    lat: 16.474871688355226,
    lng: 102.82398728773137,
  },
  "SC.5102": {
    title: "ห้องสอบ SC.5102",
    description: "อาคารเรียนรวมวิทยาศาสตร์ คณะวิทยาศาสตร์",
    lat: 16.474871688355226,
    lng: 102.82398728773137,
  },
  "SC.5103": {
    title: "ห้องสอบ SC.5103",
    description: "อาคารเรียนรวมวิทยาศาสตร์ คณะวิทยาศาสตร์",
    lat: 16.474871688355226,
    lng: 102.82398728773137,
  },
  "SC.7401": {
    title: "ห้องสอบ SC.7401",
    description: "ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ ชั้น 4",
    lat: 16.476576792328274,
    lng: 102.82434768048124,
  },
  "SC.9107": {
    title: "ห้องสอบ SC.9107",
    description: "อาคารวิทยวิภาส วิทยาลัยการคอมพิวเตอร์",
    lat: 16.475664272450587,
    lng: 102.82516966718458,
  },
  "SC.9108": {
    title: "ห้องสอบ SC.9108",
    description: "อาคารวิทยวิภาส วิทยาลัยการคอมพิวเตอร์",
    lat: 16.475664272450587,
    lng: 102.82516966718458,
  },
};

export const getRoomContent = (roomId: string) => {
  const normalizedId = roomId.trim().toUpperCase();
  const safeDictionary = Object.fromEntries(
    Object.entries(ROOM_CONTENT).map(([k, v]) => [k.trim().toUpperCase(), v])
  );

  return safeDictionary[normalizedId] || {
    title: `ห้องสอบ ${roomId}`,
    description: "College of Computing มหาวิทยาลัยขอนแก่น"
  };
};
