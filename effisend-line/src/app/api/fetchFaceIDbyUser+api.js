import { fetchEnhanced } from "./fetchEnhanced";

export async function fetchFaceIDbyUser(body) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-API-Key", process.env.AI_URL_API_KEY);
  const raw = JSON.stringify(body);
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };
  try {
    const response = await fetchEnhanced(
      [`${process.env.FETCH_FACEID_BY_USER_API}`],
      requestOptions
    );
    const result = await response.json();
    return result;
  } catch {
    return null;
  }
}

export async function POST(request) {
  const body = await request.json();
  const { result } = await fetchFaceIDbyUser(body);
  return Response.json({ result });
}
