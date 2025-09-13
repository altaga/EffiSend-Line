export async function POST(request) {
  try {
    const body = await request.json(); // parse JSON body
    console.log("📩 Incoming POST request body:", body);

    return Response.json({
      status: "ok",
      received: body,
    });
  } catch (error) {
    console.error("❌ Error parsing request:", error);
    return Response.json({ error: "Invalid JSON or request" }, { status: 400 });
  }
}