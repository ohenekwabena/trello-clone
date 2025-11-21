"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Crown, Shield, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getOrganizationMembers } from "@/lib/actions/organizations";
import { getInitials, getAvatarColor, getDisplayName } from "@/lib/utils/user-helpers";
import type { OrganizationMemberWithProfile } from "@/lib/types/user";

interface MembersListProps {
  organizationId: string;
}

export function MembersList({ organizationId }: MembersListProps) {
  const [members, setMembers] = useState<OrganizationMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMembers() {
      setIsLoading(true);
      const result = await getOrganizationMembers(organizationId);

      if (result.success && result.data) {
        setMembers(result.data);
      } else {
        setError(result.error || "Failed to load members");
      }

      setIsLoading(false);
    }

    fetchMembers();
  }, [organizationId]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-3 h-3" />;
      case "admin":
        return <Shield className="w-3 h-3" />;
      default:
        return <UserIcon className="w-3 h-3" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "admin":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse"
          >
            <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-1" />
              <div className="h-3 w-48 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">No members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member, index) => (
        <motion.div
          key={member.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Avatar className="w-10 h-10">
            {member.profile?.avatar_url ? (
              <AvatarImage src={member.profile.avatar_url} alt={getDisplayName(member.profile)} />
            ) : null}
            <AvatarFallback
              className={`${
                member.profile ? getAvatarColor(member.profile) : "bg-gradient-to-br from-purple-500 to-blue-500"
              } text-white font-medium text-sm`}
            >
              {member.profile ? getInitials(member.profile) : "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {member.profile ? getDisplayName(member.profile) : "Unknown User"}
              </p>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {member.profile?.email || "No email"}
            </p>
          </div>

          <Badge
            variant="outline"
            className={`${getRoleBadgeColor(member.role)} text-xs font-medium flex items-center gap-1 shrink-0`}
          >
            {getRoleIcon(member.role)}
            <span className="capitalize">{member.role}</span>
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}
