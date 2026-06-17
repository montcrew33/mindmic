import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

const DEMO_USER_EMAIL = "demo@personal-meeting-brain.local";

export async function getCurrentAppUserId() {
  const userClient = await createServerSupabaseClient();
  const {
    data: { user }
  } = await userClient.auth.getUser();

  if (user) {
    return user.id;
  }

  return ensureDemoUser();
}

async function ensureDemoUser() {
  const serviceClient = createServiceSupabaseClient();
  const { data: users, error: listError } = await serviceClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (listError) {
    throw listError;
  }

  const existingUser = users.users.find((candidate) => candidate.email === DEMO_USER_EMAIL);
  const userId =
    existingUser?.id ??
    (
      await serviceClient.auth.admin.createUser({
        email: DEMO_USER_EMAIL,
        email_confirm: true,
        user_metadata: {
          full_name: "Demo User"
        }
      })
    ).data.user?.id;

  if (!userId) {
    throw new Error("Could not create or load demo user.");
  }

  await serviceClient.from("profiles").upsert({
    id: userId,
    email: DEMO_USER_EMAIL,
    full_name: "Demo User"
  });

  return userId;
}
