// app/protected/admin/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { RiDeleteBin4Fill } from "react-icons/ri";
import { FaClipboardCheck } from "react-icons/fa";

export type UserRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  student_id: number | null;
  school: "Denmark" | "Other" | null;
  requested_role: string | null;
  role: string | null;
  created_at: string;       // ISO
  last_sign_in_at: string | null;
};

export const roleOptions = ["Pending","Member","Officer","President","Advisor","Admin"] as const;

const fmt = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString();
};

export const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => <div className="whitespace-nowrap">{fmt(row.original.created_at)}</div>,
    sortingFn: "datetime",
    enableHiding: false,
  },
  {
    accessorKey: "student_id",
    header: "Student ID",
    cell: ({ row }) => row.original.student_id ?? "-",
  },
  {
    accessorKey: "school",
    header: "School",
    cell: ({ row }) => <span className="text-sm">{row.original.school ?? "-"}</span>, // plain text
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email ?? "-",
  },
  {
    id: "full_name",
    header: "Full Name",
    cell: ({ row }) => {
      const { first_name, last_name } = row.original;
      const full = [first_name, last_name].filter(Boolean).join(" ");
      return full || "-";
    },
  },
  {
    accessorKey: "requested_role",
    header: "Requested Role",
    cell: ({ row }) => row.original.requested_role ?? "-",
  },
  {
    id: "role",
    header: "Role",
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        busyId?: string | null;
        onRoleChange?: (id: string, newRole: string) => Promise<void>;
      } | undefined;

      const disabled = meta?.busyId === row.original.id;
      const current = row.original.role ?? "Pending";

      return (
        <Select
          value={current}
          onValueChange={(val) => {
            if (disabled || !meta?.onRoleChange) return;
            meta.onRoleChange(row.original.id, val);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        busyId?: string | null;
        onApprove?: (id: string) => Promise<void>;
        onDelete?: (id: string) => Promise<void>;
      } | undefined;

      const disabled = meta?.busyId === row.original.id;

      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-25 w-25"
            title={row.original.requested_role ? "Approve requested role" : "No request to approve"}
            onClick={() => meta?.onApprove?.(row.original.id)}
            disabled={disabled || !row.original.requested_role}
          >
            <FaClipboardCheck
              className={row.original.requested_role ? "text-green-600" : "text-muted-foreground"}
              size={35}
            />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-25 w-25"
            title="Delete user"
            onClick={() => meta?.onDelete?.(row.original.id)}
            disabled={disabled}
          >
            <RiDeleteBin4Fill className="text-red-600" size={35} />
          </Button>
        </div>
      );
    },
    enableSorting: false,
  },
];
