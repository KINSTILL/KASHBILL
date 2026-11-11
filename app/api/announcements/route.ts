import { jsonOk } from '@/lib/api-helpers';
import { getActiveAnnouncement } from '@/lib/announcements';

export async function GET(): Promise<Response> {
  const announcement = await getActiveAnnouncement();
  return jsonOk({ announcement });
}
