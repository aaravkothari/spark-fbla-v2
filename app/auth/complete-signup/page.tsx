"use client";

import { useEffect, useState } from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Dropdown, { type DropdownItem } from "@/components/dropdown";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const schools: DropdownItem[] = [
  { value: "Denmark", label: "Denmark High School" },
  { value: "Other", label: "Other" },
];

const roles: DropdownItem[] = [
  { value: "Member", label: "Member" },
  { value: "Officer", label: "Officer" },
  { value: "President", label: "President" },
  { value: "Advisor", label: "Advisor" },
  { value: "Admin", label: "Admin" }, // saved as requested_role
];

export default function CompleteSignUp() {
  const supabase = createClient();
  const router = useRouter();
  const [school, setSchool] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // (Optional) verify the user is logged in before allowing submit
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        setUid(null);
        return;
      }
      setUid(data?.user?.id ?? null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!uid) {
      setError("You must be signed in to complete sign up.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const first_name = String(formData.get("first_name") || "").trim();
    const last_name = String(formData.get("last_name") || "").trim();
    const student_id_raw = formData.get("student_id");
    const student_id =
      typeof student_id_raw === "string" && student_id_raw.length > 0
        ? Number(student_id_raw)
        : null;

    // Basic validation
    if (!first_name || !last_name) return setError("Please enter your full name.");
    if (!school) return setError("Please choose a school.");
    if (!role) return setError("Please choose a role to request.");
    if (student_id === null || !Number.isFinite(student_id))
      return setError("Student ID must be a valid number.");

    setSubmitting(true);

    // Update ONLY allowed fields; role remains admin-controlled
    const { error: upErr } = await supabase
      .from("users")
      .update({
        first_name,
        last_name,
        school,                 // 'Denmark' | 'Other' (check constraint)
        requested_role: role,   // the user's chosen role
        student_id,             // INT column you added
      })
      .eq("id", uid);

    setSubmitting(false);

    if (upErr) {
      console.error("Update error:", upErr);
      setError(upErr.message);
      return;
    }

    router.push("/protected");
  };

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6")}>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2">
                <a href="#" className="flex flex-col items-center gap-2 font-medium">
                  <div className="flex size-8 items-center justify-center rounded-md">
                    <GalleryVerticalEnd className="size-6" />
                  </div>
                  <span className="sr-only">Spark-FBLA</span>
                </a>
                <h1 className="text-xl font-bold">Welcome to Spark-FBLA</h1>
                <div className="text-center text-sm">Please complete your Sign-Up</div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <div className="flex justify-between gap-2">
                    <Input id="first_name" name="first_name" type="text" placeholder="First" required />
                    <Input id="last_name" name="last_name" type="text" placeholder="Last" required />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="student_id_html">Student ID</Label>
                  <Input id="student_id" name="student_id" type="number" placeholder="School Issued ID" required />
                </div>

                <div className="grid gap-2">
                  <Label>School</Label>
                  <Dropdown
                    items={schools}
                    value={school}
                    onChange={setSchool}
                    placeholder="Select School"
                    searchPlaceholder="Search school..."
                    emptyText="No school found."
                    buttonClassName="text-gray-500"
                  />
                  {/* keep this so FormData sees the value */}
                  <input type="hidden" name="school" value={school} />
                </div>

                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Dropdown
                    items={roles}
                    value={role}
                    onChange={setRole}
                    placeholder="Select Role"
                    searchPlaceholder="Search roles..."
                    emptyText="No role found."
                    buttonClassName="text-gray-500"
                  />
                  {/* keep this so FormData sees the value */}
                  <input type="hidden" name="role" value={role} />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting || !uid}>
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
