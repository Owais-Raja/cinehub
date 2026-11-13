import { AuditService } from "@/services/audit.service";
import { ScrollText, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const logs = await AuditService.getLogs({ limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2D3748]">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-[#E83B50]" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="text-xs text-[#8E9AA8] mt-0.5">
            Cryptographically timestamped log of critical business, financial, and operational operations
          </p>
        </div>
      </div>

      <div className="bg-[#212836] rounded-2xl border border-[#2D3748] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2D3748] text-[#8E9AA8] bg-[#1E2430]">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Entity</th>
                <th className="py-3 px-4 font-semibold">Metadata Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3748]/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#1E2430]/50 transition-colors">
                  <td className="py-3 px-4 text-[#8E9AA8] font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    <span className="px-2 py-0.5 rounded bg-[#171923] border border-[#2D3748] text-[10px] font-mono text-[#E8B86D]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white">
                    {log.user ? (
                      <div>
                        <span className="font-semibold block">{log.user.fullName}</span>
                        <span className="text-[10px] text-[#8E9AA8]">{log.user.email}</span>
                      </div>
                    ) : (
                      <span className="text-[#8E9AA8] italic">System</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#8E9AA8] font-mono text-[11px]">
                    {log.entityType}: {log.entityId.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-4 text-[#8E9AA8] font-mono text-[10px] max-w-xs truncate">
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
