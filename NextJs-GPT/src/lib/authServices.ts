// File: HELPS with authentication and user management in a Next.js application.
// This module provides functions to register and validate users via API calls.
// It uses the Fetch API to communicate with a backend server for user management.


export async function registerUser(email: string, password: string) {
  const response = await fetch("http://localhost:3001/registerUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Registration failed.");
  }

  return await response.json();
}

export async function validateUser(email: string, password: string) {
  const response = await fetch("http://localhost:3001/validateUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Login failed.");
  }

  return await response.json();
}


