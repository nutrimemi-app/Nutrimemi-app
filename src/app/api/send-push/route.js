import webpush from 'web-push';
import { NextResponse } from 'next/server';

webpush.setVapidDetails(
  `mailto:${process.env.VAPIDEMAIL}`,
  process.env.P_keynutrimemi,
  process.env.VPRIVATEKEY
);

export async function POST(req) {
  try {
    const { subscription, title, body, url } = await req.json();
    if (!subscription) return NextResponse.json({ error: 'No subscription' }, { status: 400 });

    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, url: url || '/' })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Push error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
