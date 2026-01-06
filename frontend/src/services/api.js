const API_BASE_URL = "http://127.0.0.1:8000/api";

/**
 * Generic helper for GET requests
 */
async function get(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Log raw response for debugging
  console.log("API response status:", response.status);

  if (!response.ok) {
    let errorBody = {};
    try {
      errorBody = await response.json();
    } catch (_) {}

    console.error("Backend error:", errorBody);

    throw new Error(
      errorBody.detail || "API request failed"
    );
  }

  return response.json();
}

/**
 * Fetch interview questions by category
 * @param {string} category
 */
async function getQuestions(category) {
  if (!category) {
    throw new Error("Category is undefined");
  }

  const url = `${API_BASE_URL}/questions/${category}`;
  console.log("Calling API:", url);

  return get(url);
}

const api = {
  getQuestions,
};

export default api;
