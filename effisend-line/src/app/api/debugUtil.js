export async function debugServer(data) {
  try {
    const res = await fetch("/api/debug", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    //console.log("✅ Server response:", json);
  } catch (err) {
    //console.error("❌ Error sending debug data:", err);
  }
}