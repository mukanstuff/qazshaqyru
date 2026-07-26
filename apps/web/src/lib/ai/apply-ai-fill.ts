import type { AiFillOutput } from '@/lib/ai/fill-invitation';

/** Map AI fill output → Live Editor document field paths. */
export function aiFillToFieldPatches(data: AiFillOutput): Array<{ path: string; value: string }> {
  const patches: Array<{ path: string; value: string }> = [];
  if (data.bodyRu) {
    patches.push({ path: 'customText.bodyTextRu', value: data.bodyRu });
    patches.push({ path: 'customText.bodyRu', value: data.bodyRu });
  }
  if (data.bodyKz) {
    patches.push({ path: 'customText.bodyTextKz', value: data.bodyKz });
    patches.push({ path: 'customText.bodyKz', value: data.bodyKz });
  }
  const hosts = data.hostsLine || data.greeting;
  if (hosts) {
    patches.push({ path: 'customText.greeting', value: hosts });
    patches.push({ path: 'customText.hostsLine', value: hosts });
  }
  if (data.rsvpIntro) {
    patches.push({ path: 'customText.rsvpIntro', value: data.rsvpIntro });
    patches.push({ path: 'customText.rsvpTitle', value: data.rsvpIntro });
  }
  if (data.dressCode) {
    patches.push({ path: 'customText.dressCode', value: data.dressCode });
    patches.push({ path: 'customText.dressCodeNote', value: data.dressCode });
  }
  if (data.whatsappMessage) {
    patches.push({ path: 'customText.whatsappMessage', value: data.whatsappMessage });
  }
  return patches;
}
