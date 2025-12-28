import { OnboardingFormClient } from "./onboarding-form.client"
import { createClient } from "@/supabase/server"

export async function OnboardingFormWrapper() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <OnboardingFormClient user={user} />
}

