import React, { useState } from 'react';

interface Report {
  _id: string;
  reporterId: string;
  reportedUserId: string;
  sessionId?: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

interface ReportsManagementProps {
  reports: Report[];
  loading: boolean;
  error: string | null;
  onResolveReport: (reportId: string, action: 'resolve' | 'dismiss') => Promise<void>;
}

const ReportsManagement: React.FC<ReportsManagementProps> = ({
  reports,
  loading,
  error,
  onResolveReport
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter reports based on search term and status
  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' ||
      report.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-medium text-white">Moderation Reports</h2>

        <div className="flex flex-col text-white sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 bg-[#1E293B] border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-white placeholder-gray-400"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#1E293B] border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4 text-gray-400">
          <p>Loading reports...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mobile View - Cards for small screens */}
          <div className="sm:hidden space-y-3">
            {filteredReports.map((report) => (
              <div key={report._id} className="bg-[#1E293B] border border-gray-700 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-400">Reporter:</span>
                    <span className="ml-2 text-gray-300">{report.reporterId.substring(0, 8)}...</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-400">Reported User:</span>
                    <span className="ml-2 text-gray-300">{report.reportedUserId.substring(0, 8)}...</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-400">Reason:</span>
                    <span className="ml-2 text-gray-300">{report.reason}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-400">Description:</span>
                    <p className="ml-2 mt-1 text-gray-300">{report.description}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-400">Status:</span>
                    <span className={`ml-2 px-2 py-0.5 text-xs leading-5 font-semibold rounded-full ${
                      report.status === 'pending' ? 'bg-yellow-900 text-yellow-200' :
                      report.status === 'reviewed' ? 'bg-blue-900 text-blue-200' :
                      report.status === 'resolved' ? 'bg-green-900 text-green-200' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-400">Date:</span>
                    <span className="ml-2 text-gray-300">{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={async () => {
                          await onResolveReport(report._id, 'resolve');
                        }}
                        className="text-sm text-green-400 hover:text-green-300 mr-3"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={async () => {
                          await onResolveReport(report._id, 'dismiss');
                        }}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {report.status !== 'pending' && (
                    <span className="text-sm text-gray-500">No actions available</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table for larger screens */}
          <div className="hidden sm:block overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-[#0F172A]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Reported
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Reason
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#1E293B] divide-y divide-gray-700">
                {filteredReports.map((report) => (
                  <tr key={report._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {report.reporterId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {report.reportedUserId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {report.reason}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                      {report.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        report.status === 'pending' ? 'bg-yellow-900 text-yellow-200' :
                        report.status === 'reviewed' ? 'bg-blue-900 text-blue-200' :
                        report.status === 'resolved' ? 'bg-green-900 text-green-200' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={async () => {
                              await onResolveReport(report._id, 'resolve');
                            }}
                            className="text-green-400 hover:text-green-300 mr-2"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={async () => {
                              await onResolveReport(report._id, 'dismiss');
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      {report.status !== 'pending' && (
                        <span className="text-gray-500">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredReports.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No reports found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;