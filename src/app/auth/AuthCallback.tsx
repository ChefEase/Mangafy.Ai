import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/utils/supabaseClient";
import "./callback/callback.css";
import { useUser } from "@/context/UserContext";

export default function AuthCallback() {
  const router = useRouter();
  const { setUser } = useUser();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
      if (!session || sessionError) {
        router.push("/login?error=authentication_failed");
        return;
      }
  
      const userId = session.user.id;
      const userEmail = session.user.email;
      const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || null;
  
      console.log("AuthCallback: userId:", userId, "userEmail:", userEmail);
  
      if (typeof window !== "undefined" && userId) {
        localStorage.setItem("userId", userId);
      }
      // Check if user exists in 'users' table
      const { data: existingUser, error: fetchUserError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
  
      if (fetchUserError && fetchUserError.code !== "PGRST116") {
        console.error("Error checking for existing user:", fetchUserError);
        router.push("/login?error=fetch_user_failed");
        return;
      }
  
      const isNewUser = !existingUser;
  
      if (isNewUser) {
        // Only insert user if they are new
        const { data: newUser, error: insertUserError } = await supabase
          .from("users")
          .insert({
            id: userId,
            email: userEmail,
            name: fullName,
            credits: 125,
          })
          .select()
          .single();
  
        if (insertUserError) {
          console.error("Error inserting new user:", insertUserError);
          router.push("/login?error=user_creation_failed");
          return;
        }
  
        console.log("Created new user:", newUser);
  
        // Insert device_claims
        const { error: insertDeviceError } = await supabase
          .from("device_claims")
          .insert({
            user_id: userId,
            device_info: "Initial login device",
          });
  
        if (insertDeviceError) {
          console.error("Error inserting device_claims:", insertDeviceError);
          // Not fatal, continue
        }

        // 🟢 Only now do referral credit logic
        let referrerId = searchParams?.get("ref");
        console.log("AuthCallback: referrerId from searchParams:", referrerId);

        if (referrerId) {
          const { error: referralError } = await supabase.rpc("award_referrer_credits", {
            p_referrer_id: referrerId,
            p_credits: 125,
          });
        
          if (referralError) {
            console.error("Error awarding referral credits:", referralError);
          } else {
            console.log("Awarded referral credits to:", referrerId);
          }
        }
  
      } else {
        console.log("User already exists, skipping user/referral creation");
      }
      if (typeof window !== "undefined" && !localStorage.getItem("userId")) {
        localStorage.setItem("userId", userId);
      }
      router.push("/project-management");
    };
  
    handleAuth();
  }, [router, searchParams]);
  
  return <div className="loading-screen">Authenticating...</div>;
}
