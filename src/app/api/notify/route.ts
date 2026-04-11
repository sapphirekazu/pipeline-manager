// ============================================
// Chatwork通知API（サーバーサイド）
// ============================================
// 環境変数 CHATWORK_API_TOKEN と CHATWORK_ROOM_ID を使用
// ブラウザには露出しない

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { message } = (await request.json()) as { message?: string };

    if (!message || typeof message !== "string") {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const token = process.env.CHATWORK_API_TOKEN;
    const roomId = process.env.CHATWORK_ROOM_ID;

    if (!token || !roomId) {
      console.warn("Chatwork環境変数が未設定のためスキップ");
      return Response.json({ skipped: true });
    }

    const res = await fetch(
      `https://api.chatwork.com/v2/rooms/${roomId}/messages`,
      {
        method: "POST",
        headers: {
          "X-ChatWorkToken": token,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ body: message, self_unread: "1" }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Chatwork API error:", res.status, errText);
      return Response.json(
        { error: `Chatwork API error: ${res.status}`, detail: errText },
        { status: 500 }
      );
    }

    const data = await res.json();
    return Response.json({ success: true, data });
  } catch (e) {
    console.error("Notify error:", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
