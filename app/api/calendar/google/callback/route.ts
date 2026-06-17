import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "not_implemented",
    next: "Exchange the Google OAuth code, encrypt/store tokens, then sync calendar_events."
  });
}
