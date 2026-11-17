import { redirect } from "next/navigation";

export default function DisabledEmailSignupPage() {
  redirect("/signup");
}
