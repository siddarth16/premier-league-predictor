// Standings Table component
import React from 'react';
import { Standing } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { LoadingTableRow } from './ui/Loading';

interface StandingsTableProps {
  standings: Standing[];
  loading?: boolean;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ 
  standings, 
  loading = false 
}) => {
  const getPositionColor = (position: number) => {
    if (position <= 4) return 'text-green-600'; // Champions League
    if (position <= 6) return 'text-blue-600';  // Europa League
    if (position >= 18) return 'text-red-600';  // Relegation
    return 'text-gray-900';
  };

  const getFormDots = (form: string) => {
    if (!form) return null;
    
    return form.split('').slice(-5).map((result, index) => {
      const colorClass = result === 'W' ? 'bg-green-500' : 
                        result === 'D' ? 'bg-yellow-500' : 'bg-red-500';
      
      return (
        <div 
          key={index}
          className={`w-2 h-2 rounded-full ${colorClass}`}
          title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
        />
      );
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Premier League Table</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  W
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  D
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GF
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GA
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GD
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pts
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Form
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 20 }).map((_, index) => (
                  <LoadingTableRow key={index} columns={11} />
                ))
              ) : standings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                    No standings data available
                  </td>
                </tr>
              ) : (
                standings.map((standing) => (
                  <tr 
                    key={standing.team.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getPositionColor(standing.rank)}`}>
                        {standing.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {standing.team.logo && (
                          <img 
                            src={standing.team.logo} 
                            alt={standing.team.name}
                            className="w-6 h-6 mr-3 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {standing.team.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {standing.all.played}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {standing.all.win}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {standing.all.draw}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {standing.all.lose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {standing.all.goals.for}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {standing.all.goals.against}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span className={standing.goalsDiff >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {standing.goalsDiff > 0 ? '+' : ''}{standing.goalsDiff}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                      {standing.points}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-1">
                        {getFormDots(standing.form)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        {!loading && standings.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t text-xs text-gray-600">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-600 rounded mr-2"></div>
                Champions League (1-4)
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                Europa League (5-6)
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded mr-2"></div>
                Relegation (18-20)
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};