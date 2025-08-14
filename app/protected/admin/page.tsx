"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import Dropdown, { type DropdownItem } from "@/components/dropdown";
import { RiDeleteBin4Fill } from "react-icons/ri";
import { FaClipboardCheck } from "react-icons/fa";

type UserRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  student_id: number | null;
  school: "Denmark" | "Other" | null;
  requested_role: string | null;
  role: string | null;
  created_at: string;        // ISO
  last_sign_in_at: string | null;
};

const roles: DropdownItem[] = [
  { value: "Pending", label: "Pending" },
  { value: "Member", label: "Member" },
  { value: "Officer", label: "Officer" },
  { value: "President", label: "President" },
  { value: "Advisor", label: "Advisor" },
  { value: "Admin", label: "Admin" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); // user id currently being updated
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Failed to load users");
      setLoading(false);
      return;
    }
    const j = await res.json();
    setUsers(j.users || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const onApprove = async (id: string) => {
    setBusy(id); setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "approve" }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Approve failed");
      return;
    }
    fetchUsers();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this user from Auth and DB? This cannot be undone.")) return;
    setBusy(id); setError(null);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Delete failed");
      return;
    }
    fetchUsers();
  };

  const onRoleChange = async (id: string, newRole: string) => {
    setBusy(id); setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "set", role: newRole }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Role update failed");
      return;
    }
    fetchUsers();
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="">
          <Table>
            <TableCaption>
              {loading ? "Loading…" : "A list of all users (newest first)"}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Created At</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Requested Role</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>No users found.</TableCell>
                </TableRow>
              )}
              {users.map((u) => {
                const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ");
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {formatDateTime(u.created_at)}
                    </TableCell>
                    <TableCell>{u.student_id ?? "-"}</TableCell>
                    <TableCell>{u.school ?? "-"}</TableCell>
                    <TableCell>{u.email ?? "-"}</TableCell>
                    <TableCell>{fullName || "-"}</TableCell>
                    <TableCell>{u.requested_role ?? "-"}</TableCell>
                    <TableCell>
                      <Dropdown
                        items={roles}
                        value={u.role ?? "Pending"}
                        onChange={(val) => {
                            if (busy === u.id) return; // no-op while busy
                            onRoleChange(u.id, val);
                            }}
                        placeholder="Select Role"
                        searchPlaceholder="Search roles..."
                        emptyText="No role found."
                        buttonClassName="text-gray-500"
                        // disabled={busy === u.id}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-4 mt-1">
                        <button
                          title="Approve requested role"
                          onClick={() => onApprove(u.id)}
                          disabled={busy === u.id || !u.requested_role}
                        >
                          <FaClipboardCheck
                            className={u.requested_role ? "text-green-600" : "text-gray-400"}
                            size={22}
                          />
                        </button>
                        <button
                          title="Delete user"
                          onClick={() => onDelete(u.id)}
                          disabled={busy === u.id}
                        >
                          <RiDeleteBin4Fill className="text-red-600" size={24} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </SidebarInset>
  );
}
