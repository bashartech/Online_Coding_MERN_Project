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
        <h2 className="text-lg font-medium text-gray-900">Moderation Reports</h2>

        <div className="flex flex-col text-gray-900 sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
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
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <p>Loading reports...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mobile View - Cards for small screens */}
          <div className="sm:hidden space-y-3">
            {filteredReports.map((report) => (
              <div key={report._id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Reporter:</span>
                    <span className="ml-2 text-gray-700">{report.reporterId.substring(0, 8)}...</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Reported User:</span>
                    <span className="ml-2 text-gray-700">{report.reportedUserId.substring(0, 8)}...</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Reason:</span>
                    <span className="ml-2 text-gray-700">{report.reason}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Description:</span>
                    <p className="ml-2 mt-1 text-gray-700">{report.description}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-0.5 text-xs leading-5 font-semibold rounded-full ${
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                      report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Date:</span>
                    <span className="ml-2 text-gray-700">{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={async () => {
                          await onResolveReport(report._id, 'resolve');
                        }}
                        className="text-sm text-green-600 hover:text-green-900 mr-3"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={async () => {
                          await onResolveReport(report._id, 'dismiss');
                        }}
                        className="text-sm text-red-600 hover:text-red-900"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {report.status !== 'pending' && (
                    <span className="text-sm text-gray-400">No actions available</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table for larger screens */}
          <div className="hidden sm:block overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.reporterId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.reportedUserId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.reason}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {report.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={async () => {
                              await onResolveReport(report._id, 'resolve');
                            }}
                            className="text-green-600 hover:text-green-900 mr-2"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={async () => {
                              await onResolveReport(report._id, 'dismiss');
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      {report.status !== 'pending' && (
                        <span className="text-gray-400">No actions</span>
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