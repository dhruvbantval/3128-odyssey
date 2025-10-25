"use client";

import { useState, useEffect } from "react";
import { 
  Battery, 
  Wifi, 
  Trophy, 
  Clock, 
  Users, 
  Zap, 
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Thermometer,
  ChevronDown,
  ChevronUp,
  Home,
  Waves
} from 'lucide-react';

interface BatteryRecord {
  id: string;
  timestamp: number;
  batteryId: string;
  voltage: number;
  current: number;
  temperature: number;
  cycleCount: number;
  status: 'charging' | 'discharging' | 'idle';
  location: string;
  grade: 'A' | 'B' | 'C';
  rank: 'Competition' | 'Practice' | 'Driver station' | 'Retired';
  notes?: string;
}

interface Match {
  key: string;
  comp_level: string;
  match_number: number;
  alliances: {
    red: { team_keys: string[]; score: number };
    blue: { team_keys: string[]; score: number };
  };
  winning_alliance: string;
  time: number;
  actual_time?: number;
  score_breakdown?: any;
}

interface Ranking {
  rank: number;
  team_key: string;
  record: { wins: number; losses: number; ties: number };
  qual_average: number;
}

interface EPAData {
  overall: string;
  auto: string;
  teleop: string;
  endgame: string;
  source: 'statbotics' | 'local';
}

export default function NARPitDashboard() {
  const [activeTab, setActiveTab] = useState('setup');
  const [eventKey, setEventKey] = useState('');
  const [teamNumber, setTeamNumber] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [batteryData, setBatteryData] = useState<BatteryRecord[]>([]);
  const [batteryStats, setBatteryStats] = useState<any>({});
  const [liveEventData, setLiveEventData] = useState<any>(null);
  const [teamEPA, setTeamEPA] = useState<EPAData>({ overall: '0', auto: '0', teleop: '0', endgame: '0', source: 'local' });
  const [statboticsData, setStatboticsData] = useState<any>(null);
  const [streamUrl, setStreamUrl] = useState<any>(null);
  
  const [newBattery, setNewBattery] = useState({
    batteryId: '',
    voltage: '',
    current: '',
    temperature: '',
    status: 'idle' as 'charging' | 'discharging' | 'idle',
    location: '',
    grade: 'A' as 'A' | 'B' | 'C',
    rank: 'Practice' as 'Competition' | 'Practice' | 'Driver station' | 'Retired',
    notes: ''
  });

  const [expandedBattery, setExpandedBattery] = useState<string | null>(null);
  const [batteryFilter, setBatteryFilter] = useState('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [liveUpdateManager] = useState(() => {
    const intervals = new Map();
    let isLive = false;
    
    return {
      intervals,
      isLive,
      
      startLiveUpdates: function(callbacks: any, eventKey: string, teamNumber: string, intervalMs = 5000) {
        isLive = true;
        
        // Clear any existing intervals first
        intervals.forEach((interval) => {
          clearInterval(interval);
        });
        intervals.clear();
        
        Object.entries(callbacks).forEach(([name, callback]: [string, any]) => {
          const interval = setInterval(async () => {
            if (isLive) {
              try {
                await callback(eventKey, teamNumber);
              } catch (error) {
                console.error(`Update error for ${name}:`, error);
              }
            }
          }, intervalMs);
          
          intervals.set(name, interval);
        });
      },
      
      stopLiveUpdates: function() {
        isLive = false;
        intervals.forEach((interval) => {
          clearInterval(interval);
        });
        intervals.clear();
      }
    };
  });

  const addBatteryRecord = async (batteryData: any) => {
    try {
      const response = await fetch('/api/battery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...batteryData, timestamp: Date.now() })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error adding battery record:', error);
      throw error;
    }
  };

  const getBatteryRecords = async () => {
    try {
      const response = await fetch('/api/battery');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching battery records:', error);
      return [];
    }
  };

  const fetchTeamMatches = async (eventKey: string, teamNumber: string) => {
    try {
      const response = await fetch(`/api/tba?endpoint=matches&eventKey=${eventKey}&teamNumber=${teamNumber}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.error ? null : data;
    } catch (error) {
      console.error('Error fetching team matches:', error);
      return null;
    }
  };

  const fetchEventMatches = async (eventKey: string) => {
    try {
      const response = await fetch(`/api/tba?endpoint=event-matches&eventKey=${eventKey}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.error ? null : data;
    } catch (error) {
      console.error('Error fetching event matches:', error);
      return null;
    }
  };

  const fetchEventRankings = async (eventKey: string) => {
    try {
      const response = await fetch(`/api/tba?endpoint=rankings&eventKey=${eventKey}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.error ? null : data;
    } catch (error) {
      console.error('Error fetching event rankings:', error);
      return null;
    }
  };

  const fetchLiveEventData = async (eventKey: string) => {
    try {
      const response = await fetch(`/api/nexus?eventKey=${eventKey}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.error ? null : data;
    } catch (error) {
      console.error('Error fetching live event data:', error);
      return null;
    }
  };

  const fetchStatboticsTeamData = async (teamNumber: string) => {
    try {
      const response = await fetch(`https://api.statbotics.io/v3/team_year/${teamNumber}/2025`);
      if (!response.ok) throw new Error(`Statbotics API error! status: ${response.status}`);
      const data = await response.json();
      return {
        epa: data.epa_end || data.epa_current || 0,
        autoEPA: data.auto_epa_end || data.auto_epa_current || 0,
        teleopEPA: data.teleop_epa_end || data.teleop_epa_current || 0,
        endgameEPA: data.endgame_epa_end || data.endgame_epa_current || 0,
        winRate: data.wins / Math.max(1, data.wins + data.losses + data.ties) || 0,
        record: `${data.wins || 0}-${data.losses || 0}-${data.ties || 0}`
      };
    } catch (error) {
      console.error('Error fetching Statbotics team data:', error);
      return null;
    }
  };

  const calculateEnhancedEPA = async (teamNumber: string, eventKey: string, teamMatches: any) => {
    try {
      const response = await fetch(`https://api.statbotics.io/v3/team_event/${teamNumber}/${eventKey}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.epa_end !== undefined) {
          return {
            overall: data.epa_end.toFixed(2),
            auto: (data.auto_epa_end || 0).toFixed(2),
            teleop: (data.teleop_epa_end || 0).toFixed(2),
            endgame: (data.endgame_epa_end || 0).toFixed(2),
            source: 'statbotics' as const
          };
        }
      }
    } catch (error) {
      console.error('Statbotics fetch failed, using local calculation:', error);
    }
    
    return calculateLocalEPA(teamMatches, teamNumber);
  };

  const calculateLocalEPA = (teamMatches: any, teamNumber: string) => {
    if (!teamMatches || teamMatches.length === 0) {
      return { overall: '0.00', auto: '0.00', teleop: '0.00', endgame: '0.00', source: 'local' as const };
    }
    
    let totalScore = 0;
    let autoScore = 0;
    let teleopScore = 0;
    let endgameScore = 0;
    let validMatches = 0;
    
    teamMatches.forEach((match: any) => {
      if (match.alliances) {
        const isRed = match.alliances.red?.team_keys?.some((key: string) => key.includes(teamNumber));
        const matchScore = isRed ? match.alliances.red?.score : match.alliances.blue?.score;
        
        if (matchScore !== null && matchScore !== undefined && matchScore > 0) {
          totalScore += matchScore / 3; // Divide by 3 for alliance average
          
          // Try to extract detailed scores from breakdown if available
          if (match.score_breakdown) {
            const breakdown = isRed ? match.score_breakdown.red : match.score_breakdown.blue;
            if (breakdown) {
              autoScore += (breakdown.autoPoints || 0) / 3;
              teleopScore += (breakdown.teleopPoints || 0) / 3;
              endgameScore += (breakdown.endgamePoints || 0) / 3;
            } else {
              // Fallback: estimate based on total score
              autoScore += (matchScore * 0.3) / 3;
              teleopScore += (matchScore * 0.5) / 3;
              endgameScore += (matchScore * 0.2) / 3;
            }
          } else {
            // Fallback: estimate based on total score
            autoScore += (matchScore * 0.3) / 3;
            teleopScore += (matchScore * 0.5) / 3;
            endgameScore += (matchScore * 0.2) / 3;
          }
          
          validMatches++;
        }
      }
    });
    
    if (validMatches === 0) {
      return { overall: '0.00', auto: '0.00', teleop: '0.00', endgame: '0.00', source: 'local' as const };
    }
    
    return {
      overall: (totalScore / validMatches).toFixed(2),
      auto: (autoScore / validMatches).toFixed(2),
      teleop: (teleopScore / validMatches).toFixed(2),
      endgame: (endgameScore / validMatches).toFixed(2),
      source: 'local' as const
    };
  };

  const fetchLiveStreamUrl = async (eventKey: string) => {
    try {
      const response = await fetch(`/api/stream?eventKey=${eventKey}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const webcast = data[0];
          switch (webcast.type) {
            case 'youtube':
              return {
                type: 'youtube',
                channel: webcast.channel,
                url: `https://www.youtube.com/embed/${webcast.channel}/live?autoplay=1`
              };
            case 'twitch':
              return {
                type: 'twitch',
                channel: webcast.channel,
                url: `https://player.twitch.tv/?channel=${webcast.channel}&autoplay=true`
              };
            default:
              return { type: 'direct', url: webcast.url || webcast.file };
          }
        }
      }
      
      return {
        type: 'youtube',
        channel: 'FIRSTINSPIRES',
        url: 'https://www.youtube.com/embed/live_stream?channel=FIRSTINSPIRES&autoplay=1'
      };
    } catch (error) {
      console.error('Error fetching live stream URL:', error);
      return {
        type: 'youtube',
        channel: 'FIRSTINSPIRES',
        url: 'https://www.youtube.com/embed/live_stream?channel=FIRSTINSPIRES&autoplay=1'
      };
    }
  };

  const analyzeBatteryHealth = (batteryRecords: BatteryRecord[], batteryId: string) => {
    if (!batteryRecords || !Array.isArray(batteryRecords) || !batteryId) {
      return { health: 'unknown', warnings: ['Invalid data'] };
    }

    const records = batteryRecords.filter(r => r && r.batteryId === batteryId).sort((a, b) => a.timestamp - b.timestamp);
    
    if (records.length < 1) return { health: 'unknown', warnings: ['No data available'] };
    
    const latest = records[records.length - 1];
    if (!latest) return { health: 'unknown', warnings: ['Invalid record'] };
    
    let health = 'good';
    let warnings: string[] = [];
    
    // Check voltage
    if (latest.voltage < 11.8) warnings.push('Low voltage');
    else if (latest.voltage < 12.0) warnings.push('Voltage declining');
    
    // Check temperature
    if (latest.temperature > 50) warnings.push('High temperature');
    else if (latest.temperature > 45) warnings.push('Temperature rising');
    
    // Check data freshness
    const hoursAgo = (Date.now() - latest.timestamp) / (1000 * 60 * 60);
    if (hoursAgo > 2) warnings.push('Data outdated');
    
    // Determine health status
    if (warnings.length > 1) health = 'critical';
    else if (warnings.length > 0) health = 'warning';
    
    return { health, warnings };
  };

  const getBatteryUsageStats = (batteryRecords: BatteryRecord[]) => {
    const stats: any = {};
    const uniqueBatteries = [...new Set(batteryRecords.map(r => r.batteryId))];
    
    uniqueBatteries.forEach(batteryId => {
      const records = batteryRecords.filter(r => r.batteryId === batteryId).sort((a, b) => a.timestamp - b.timestamp);
      const analysis = analyzeBatteryHealth(batteryRecords, batteryId);
      const latest = records[records.length - 1];
      
      stats[batteryId] = {
        totalCycles: records.length,
        currentVoltage: latest?.voltage || 0,
        currentTemp: latest?.temperature || 0,
        lastUsed: latest?.timestamp || 0,
        status: analysis.health,
        location: latest?.location || 'Unknown',
        grade: latest?.grade || 'A',
        rank: latest?.rank || 'Practice',
        warnings: analysis.warnings,
        notes: latest?.notes || ''
      };
    });
    
    return stats;
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Time TBD';
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };

  const getBatteryStatusColor = (battery: BatteryRecord) => {
    const hoursAgo = (Date.now() - battery.timestamp) / (1000 * 60 * 60);
    
    if (hoursAgo > 2) return 'text-yellow-400';
    if (battery.voltage < 11.8) return 'text-red-400';
    if (battery.temperature > 50) return 'text-red-400';
    if (battery.voltage < 12.0 || battery.temperature > 45) return 'text-yellow-400';
    return 'text-cyan-400';
  };

  const getBatteryStatus = (battery: BatteryRecord) => {
    const hoursAgo = (Date.now() - battery.timestamp) / (1000 * 60 * 60);
    
    if (hoursAgo > 2) return 'warning';
    if (battery.voltage < 11.8 || battery.temperature > 50) return 'critical';
    if (battery.voltage < 12.0 || battery.temperature > 45) return 'warning';
    return 'good';
  };

  const isSetupComplete = eventKey.trim() !== '' && teamNumber.trim() !== '';

  const loadAllData = async () => {
    if (!isSetupComplete) return;
    
    setIsLoading(true);
    try {
      const [matchesData, rankingsData, batteryRecords, liveData, streamData] = await Promise.all([
        fetchEventMatches(eventKey),
        fetchEventRankings(eventKey),
        getBatteryRecords(),
        fetchLiveEventData(eventKey),
        fetchLiveStreamUrl(eventKey)
      ]);

      setMatches(matchesData || []);
      setRankings(rankingsData?.rankings || []);
      setBatteryData(batteryRecords || []);
      setBatteryStats(getBatteryUsageStats(batteryRecords || []));
      setLiveEventData(liveData);
      setStreamUrl(streamData);
      
      const teamMatches = await fetchTeamMatches(eventKey, teamNumber);
      const [epaData, statboticsTeamData] = await Promise.all([
        calculateEnhancedEPA(teamNumber, eventKey, teamMatches),
        fetchStatboticsTeamData(teamNumber)
      ]);
      
      setTeamEPA(epaData);
      setStatboticsData(statboticsTeamData);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBatteryData = async () => {
    try {
      const data = await getBatteryRecords();
      setBatteryData(data || []);
      setBatteryStats(getBatteryUsageStats(data || []));
    } catch (error) {
      console.error('Error refreshing battery data:', error);
    }
  };

  const clearAllBatteryRecords = async () => {
    setShowClearConfirm(true);
  };

  const confirmClearRecords = async () => {
    try {
      const response = await fetch('/api/battery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      await refreshBatteryData();
      setShowClearConfirm(false);
      alert('All battery records have been cleared successfully.');
    } catch (error) {
      console.error('Error clearing battery records:', error);
      alert(`Failed to clear battery records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddBatteryRecord = async () => {
    if (!newBattery.batteryId || !newBattery.voltage) {
      alert('Please fill in required fields (Battery ID and Voltage)');
      return;
    }

    try {
      const batteryRecord = {
        ...newBattery,
        voltage: parseFloat(newBattery.voltage),
        current: parseFloat(newBattery.current) || 0,
        temperature: parseFloat(newBattery.temperature) || 0,
        cycleCount: batteryData.filter(b => b.batteryId === newBattery.batteryId).length + 1
      };

      await addBatteryRecord(batteryRecord);
      await refreshBatteryData();
      
      setNewBattery({
        batteryId: '',
        voltage: '',
        current: '',
        temperature: '',
        status: 'idle',
        location: '',
        grade: 'A',
        rank: 'Practice',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding battery record:', error);
      alert('Failed to add battery record. Please try again.');
    }
  };

  const handleUpdateBatteryStatus = async (batteryId: string, status: string, notes: string) => {
    if (!batteryId || !status) {
      console.error('Missing required parameters for battery status update');
      return;
    }

    try {
      const response = await fetch('/api/battery/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batteryId, status, notes, timestamp: Date.now() })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      await refreshBatteryData();
    } catch (error) {
      console.error('Error updating battery status:', error);
      alert(`Failed to update battery status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStartCompetition = () => {
    if (!isSetupComplete) {
      alert('Please enter both Competition Key and Team Number');
      return;
    }
    
    loadAllData();
    setActiveTab('overview');
  };

  const toggleLiveUpdates = () => {
    if (isLive) {
      liveUpdateManager.stopLiveUpdates();
      setIsLive(false);
    } else {
      const updateCallbacks = {
        matches: async (eventKey: string, teamNumber: string) => {
          const data = await fetchEventMatches(eventKey);
          setMatches(data || []);
        },
        rankings: async (eventKey: string, teamNumber: string) => {
          const data = await fetchEventRankings(eventKey);
          setRankings(data?.rankings || []);
        },
        liveData: async (eventKey: string, teamNumber: string) => {
          const data = await fetchLiveEventData(eventKey);
          setLiveEventData(data);
        },
        teamEPA: async (eventKey: string, teamNumber: string) => {
          const teamMatches = await fetchTeamMatches(eventKey, teamNumber);
          if (teamMatches) {
            const epaData = await calculateEnhancedEPA(teamNumber, eventKey, teamMatches);
            setTeamEPA(epaData);
          }
        },
        statbotics: async (eventKey: string, teamNumber: string) => {
          const data = await fetchStatboticsTeamData(teamNumber);
          setStatboticsData(data);
        },
        battery: async (eventKey: string, teamNumber: string) => {
          const data = await getBatteryRecords();
          setBatteryData(data || []);
          setBatteryStats(getBatteryUsageStats(data || []));
        }
      };
      
      liveUpdateManager.startLiveUpdates(updateCallbacks, eventKey, teamNumber, 10000);
      setIsLive(true);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isLive) {
        setLastUpdate(new Date());
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLive]);

  useEffect(() => {
    return () => {
      liveUpdateManager.stopLiveUpdates();
    };
  }, []);

  const teamRanking = rankings.find(r => r.team_key === `frc${teamNumber}`);
  const teamMatches = matches.filter(match => 
    match.alliances?.red?.team_keys?.includes(`frc${teamNumber}`) ||
    match.alliances?.blue?.team_keys?.includes(`frc${teamNumber}`)
  );
  const nextMatch = teamMatches.find(match => !match.actual_time);

  const filteredBatteryData = batteryData.filter(battery => {
    if (batteryFilter === 'all') return true;
    const status = getBatteryStatus(battery);
    return status === batteryFilter;
  });

  const TabButton = ({ id, label, icon: Icon, disabled = false }: { 
    id: string; 
    label: string; 
    icon: any; 
    disabled?: boolean;
  }) => (
    <button
      onClick={() => !disabled && setActiveTab(id)}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 ${
        disabled 
          ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
          : activeTab === id 
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50' 
            : 'bg-slate-700 hover:bg-slate-600 text-cyan-400 hover:text-cyan-300'
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="bg-gradient-to-r from-slate-800 to-blue-900 shadow-2xl border-b-4 border-cyan-500">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-all transform hover:scale-105 shadow-lg cursor-pointer">
                <Home size={20} className="text-white" />
                <span className="text-white font-bold">Home</span>
              </a>
              <div className="flex items-center gap-3">
                <Waves className="text-cyan-400" size={40} />
                <div>
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    NARPit Dashboard
                  </h1>
                  <p className="text-cyan-300 text-sm font-semibold">Team 3128 • Aluminum Narwhals</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isSetupComplete && (
                <>
                  <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                    <Wifi className={isLive ? 'text-green-400' : 'text-red-400'} size={20} />
                    <button
                      onClick={toggleLiveUpdates}
                      className={`px-4 py-1 rounded-md text-sm font-bold transition-all transform hover:scale-105 ${
                        isLive 
                          ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/50' 
                          : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50'
                      }`}
                    >
                      {isLive ? 'LIVE' : 'OFFLINE'}
                    </button>
                  </div>
                  <button
                    onClick={loadAllData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 shadow-lg"
                  >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </>
              )}
              <div className="text-sm text-cyan-300 bg-slate-800/50 rounded-lg px-4 py-2">
                {isSetupComplete && (
                  <div className="font-semibold">
                    Event: <span className="text-white">{eventKey}</span> | Team: <span className="text-white">{teamNumber}</span>
                  </div>
                )}
                {lastUpdate && (
                  <div className="text-xs text-cyan-400">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <TabButton id="setup" label="Setup" icon={Zap} />
          <TabButton id="overview" label="Overview" icon={Trophy} disabled={!isSetupComplete} />
          <TabButton id="matches" label="Live Matches" icon={Clock} disabled={!isSetupComplete} />
          <TabButton id="rankings" label="Rankings" icon={Users} disabled={!isSetupComplete} />
          <TabButton id="battery" label="Battery Tracking" icon={Battery} />
          <TabButton id="stream" label="Live Stream" icon={Wifi} disabled={!isSetupComplete} />
        </div>

        {activeTab === 'setup' && (
          <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl shadow-2xl p-8 border-2 border-cyan-500/30">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <Waves className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  Competition Setup
                </h2>
                <p className="text-cyan-300 mt-2">Configure your event and team information</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2">
                    Competition Key
                  </label>
                  <input
                    type="text"
                    value={eventKey}
                    onChange={(e) => setEventKey(e.target.value)}
                    placeholder="e.g., 2025galileo"
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-cyan-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-cyan-700"
                  />
                  <p className="text-xs text-cyan-400 mt-1">Find event keys on The Blue Alliance</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2">
                    Team Number
                  </label>
                  <input
                    type="text"
                    value={teamNumber}
                    onChange={(e) => setTeamNumber(e.target.value)}
                    placeholder="e.g., 3128"
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-cyan-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-cyan-700"
                  />
                </div>

                <button
                  onClick={handleStartCompetition}
                  disabled={!isSetupComplete || isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-bold text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2xl shadow-cyan-500/50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="animate-spin" size={24} />
                      Loading...
                    </span>
                  ) : (
                    'EMBARK!'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && isSetupComplete && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-6 rounded-2xl shadow-2xl border-2 border-cyan-500/30 transform hover:scale-105 transition-all">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400">
                <Trophy className="text-yellow-400" />
                Team Ranking
              </h3>
              {teamRanking ? (
                <div className="text-center">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    #{teamRanking.rank}
                  </div>
                  <div className="text-cyan-300 font-semibold">Current Rank</div>
                  <div className="text-sm text-cyan-400 mt-2 font-semibold">
                    {teamRanking.record.wins}-{teamRanking.record.losses}-{teamRanking.record.ties}
                  </div>
                </div>
              ) : (
                <div className="text-cyan-500 text-center">No ranking data available</div>
              )}
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-6 rounded-2xl shadow-2xl border-2 border-cyan-500/30 transform hover:scale-105 transition-all">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400">
                <Zap className="text-purple-400" />
                Team EPA
              </h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  {teamEPA.overall}
                </div>
                <div className="text-cyan-300 font-semibold">
                  {teamEPA.source === 'statbotics' ? 'Statbotics EPA' : 'Estimated EPA'}
                </div>
                <div className="text-xs text-cyan-400 mt-2 font-medium">
                  Auto: {teamEPA.auto} | Teleop: {teamEPA.teleop} | End: {teamEPA.endgame}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-6 rounded-2xl shadow-2xl border-2 border-cyan-500/30 transform hover:scale-105 transition-all">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400">
                <Battery className="text-green-400" />
                Battery Status
              </h3>
              <div className="space-y-2">
                {Object.keys(batteryStats).length > 0 ? Object.entries(batteryStats).slice(0, 3).map(([id, stats]: [string, any]) => (
                  <div key={id} className="bg-slate-900/50 rounded-lg px-3 py-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-cyan-300">{id}</span>
                      <span className={`text-sm font-bold ${
                        stats.status === 'critical' ? 'text-red-400' : 
                        stats.status === 'warning' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {stats.currentVoltage.toFixed(1)}V
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={`px-2 py-1 rounded text-white font-bold ${
                        stats.grade === 'A' ? 'bg-green-500' :
                        stats.grade === 'B' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        Grade {stats.grade}
                      </span>
                      <span className={`px-2 py-1 rounded text-white font-bold ${
                        stats.rank === 'Competition' ? 'bg-purple-500' :
                        stats.rank === 'Practice' ? 'bg-blue-500' :
                        stats.rank === 'Driver station' ? 'bg-orange-500' : 'bg-gray-500'
                      }`}>
                        {stats.rank}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="text-cyan-500 text-center">No battery data</div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-6 rounded-2xl shadow-2xl border-2 border-cyan-500/30 transform hover:scale-105 transition-all">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400">
                <Clock className="text-blue-400" />
                Next Match
              </h3>
              {nextMatch ? (
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    Match {nextMatch.match_number}
                  </div>
                  <div className="text-cyan-300 font-semibold">{nextMatch.comp_level.toUpperCase()}</div>
                  <div className="text-sm text-cyan-400 mt-2 font-medium">
                    {nextMatch.time ? formatTime(nextMatch.time) : 'Time TBD'}
                  </div>
                </div>
              ) : (
                <div className="text-cyan-500 text-center">No upcoming matches</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'matches' && isSetupComplete && (
          <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl shadow-2xl border-2 border-cyan-500/30">
            <div className="p-6 border-b border-cyan-500/30">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Live Match Updates</h2>
                <div className="flex items-center gap-2 text-sm text-cyan-300 font-semibold">
                  {isLive && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
                  Auto-updating: {isLive ? 'ON' : 'OFF'}
                </div>
              </div>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto">
              {matches && matches.length > 0 ? matches.slice(0, 15).map(match => (
                <div key={match.key} className="border-b border-cyan-500/20 last:border-b-0 py-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-bold text-cyan-400">
                      {match.comp_level.toUpperCase()} {match.match_number}
                    </div>
                    <div className="text-sm text-cyan-300 font-medium">
                      {match.actual_time ? (
                        <span className="text-green-400 font-semibold">Completed: {formatTime(match.actual_time)}</span>
                      ) : match.time ? (
                        <span>Scheduled: {formatTime(match.time)}</span>
                      ) : (
                        'Time TBD'
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl ${
                      match.winning_alliance === 'red' 
                        ? 'bg-red-900/80 border-2 border-red-400 shadow-lg shadow-red-500/30' 
                        : 'bg-red-900/40 border border-red-700/50'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-red-300">Red Alliance</div>
                        <div className="font-bold text-2xl text-red-200">
                          {match.alliances?.red?.score || 0}
                        </div>
                      </div>
                      <div className="text-sm text-red-200 font-medium">
                        {match.alliances?.red?.team_keys?.map(key => 
                          key.replace('frc', '')
                        ).join(', ') || 'Teams TBD'}
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl ${
                      match.winning_alliance === 'blue' 
                        ? 'bg-blue-900/80 border-2 border-blue-400 shadow-lg shadow-blue-500/30' 
                        : 'bg-blue-900/40 border border-blue-700/50'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-blue-300">Blue Alliance</div>
                        <div className="font-bold text-2xl text-blue-200">
                          {match.alliances?.blue?.score || 0}
                        </div>
                      </div>
                      <div className="text-sm text-blue-200 font-medium">
                        {match.alliances?.blue?.team_keys?.map(key => 
                          key.replace('frc', '')
                        ).join(', ') || 'Teams TBD'}
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 text-cyan-400">
                  <Clock size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-semibold text-lg">No match data available</p>
                  <p className="text-sm text-cyan-500">Check your event key and try refreshing</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rankings' && isSetupComplete && (
          <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl shadow-2xl border-2 border-cyan-500/30">
            <div className="p-6 border-b border-cyan-500/30">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Event Rankings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Record (W-L-T)</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Avg Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/20">
                  {rankings && rankings.length > 0 ? rankings.slice(0, 30).map(ranking => (
                    <tr 
                      key={ranking.team_key} 
                      className={ranking.team_key === `frc${teamNumber}` ? 'bg-cyan-900/50 border-l-4 border-cyan-400' : 'hover:bg-slate-800/50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-cyan-300">
                        {ranking.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                        {ranking.team_key.replace('frc', '')}
                        {ranking.team_key === `frc${teamNumber}` && (
                          <span className="ml-2 px-2 py-1 text-xs bg-cyan-500 text-white rounded font-bold">YOU</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300 font-semibold">
                        {ranking.record.wins}-{ranking.record.losses}-{ranking.record.ties}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300 font-semibold">
                        {ranking.qual_average?.toFixed(1) || 'N/A'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-cyan-400">
                        <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-semibold text-lg">No ranking data available</p>
                        <p className="text-sm text-cyan-500">Check your event key and try refreshing</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'battery' && (
          <div className="space-y-6">
            {/* Clear Confirmation Modal */}
            {showClearConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-md text-white border-2 border-red-500/30">
                  <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-4 text-red-400">Clear All Battery Records</h3>
                    <p className="text-gray-300 mb-6">
                      Are you sure you want to delete ALL battery records? This action cannot be undone and will permanently remove all battery tracking data.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmClearRecords}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                      >
                        Clear All Records
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl shadow-2xl p-6 border-2 border-cyan-500/30">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Add Battery Record</h2>
                <div className="text-sm text-cyan-300 bg-slate-900/50 rounded-lg px-3 py-2">
                  <span className="font-semibold">Quick Status:</span>
                  <select 
                    onChange={(e) => {
                      if (e.target.value && newBattery.batteryId) {
                        handleUpdateBatteryStatus(newBattery.batteryId, e.target.value, 'Quick status update');
                      }
                    }}
                    className="ml-2 bg-slate-800 border border-cyan-600 rounded px-2 py-1 text-white"
                  >
                    <option value="">Select Status</option>
                    <option value="charging">Charging</option>
                    <option value="discharging">Discharging</option>
                    <option value="idle">Idle</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Battery ID (required)"
                  value={newBattery.batteryId}
                  onChange={(e) => setNewBattery({...newBattery, batteryId: e.target.value})}
                  className="px-4 py-2 bg-slate-900 border-2 border-cyan-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-cyan-700"
                />
                <input
                  type="number"
                  placeholder="Voltage (V) (required)"
                  step="0.1"
                  value={newBattery.voltage}
                  onChange={(e) => setNewBattery({...newBattery, voltage: e.target.value})}
                  className="px-4 py-2 bg-slate-900 border-2 border-cyan-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-cyan-700"
                />
                <input
                  type="number"
                  placeholder="Current (A)"
                  step="0.1"
                  value={newBattery.current}
                  onChange={(e) => setNewBattery({...newBattery, current: e.target.value})}
                  className="px-4 py-2 bg-slate-900 border-2 border-cyan-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-cyan-700"
                />
                <input
                  type="number"
                  placeholder="Temperature (°C)"
                  step="0.1"
                  value={newBattery.temperature}
                  onChange={(e) => setNewBattery({...newBattery, temperature: e.target.value})}
                  className="px-4 py-2 bg-slate-900 border-2 border-cyan-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-cyan-700"
                />
                <select
                  value={newBattery.status}
                  onChange={(e) => setNewBattery({...newBattery, status: e.target.value as any})}
                  className="px-4 py-2 bg-slate-900 border-2 border-cyan-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                >
                  <option value="idle">Idle</option>
                  <option value="charging">Charging</option>
                  <option value="discharging">Discharging</option>
                </select>
                <input
                  type="text"
                  placeholder="Location"
                  value={newBattery.location}
                  onChange={(e) => setNewBattery({...newBattery, location: e.target.value})}
                  className="px-4 py-2 bg-slate-900 border-2 border-cyan-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-cyan-700"
                />
                <select
                  value={newBattery.grade}
                  onChange={(e) => setNewBattery({...newBattery, grade: e.target.value as any})}
                  className="px-4 py-2 bg-slate-900 border-2 border-cyan-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                >
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                </select>
                <select
                  value={newBattery.rank}
                  onChange={(e) => setNewBattery({...newBattery, rank: e.target.value as any})}
                  className="px-4 py-2 bg-slate-900 border-2 border-cyan-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                >
                  <option value="Competition">Competition</option>
                  <option value="Practice">Practice</option>
                  <option value="Driver station">Driver station</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={newBattery.notes}
                  onChange={(e) => setNewBattery({...newBattery, notes: e.target.value})}
                  className="flex-1 px-4 py-2 bg-slate-900 border-2 border-cyan-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-cyan-700"
                />
                <button
                  onClick={handleAddBatteryRecord}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-cyan-500/50"
                >
                  <Battery size={20} />
                  Add Record
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-slate-800 to-green-900 p-6 rounded-2xl shadow-2xl border-2 border-green-500/30">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-green-400 text-lg">
                  <Battery size={24} />
                  Active Batteries
                </h3>
                <div className="text-4xl font-bold text-white">
                  {Object.keys(batteryStats).length}
                </div>
                <div className="text-sm text-green-300 mt-1">Total tracked</div>
              </div>
              <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-6 rounded-2xl shadow-2xl border-2 border-blue-500/30">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-blue-400 text-lg">
                  <Activity size={24} />
                  Good Health
                </h3>
                <div className="text-4xl font-bold text-white">
                  {Object.values(batteryStats).filter((s: any) => s.status === 'good').length}
                </div>
                <div className="text-sm text-blue-300 mt-1">Optimal condition</div>
              </div>
              <div className="bg-gradient-to-br from-slate-800 to-yellow-900 p-6 rounded-2xl shadow-2xl border-2 border-yellow-500/30">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-yellow-400 text-lg">
                  <AlertCircle size={24} />
                  Warnings
                </h3>
                <div className="text-4xl font-bold text-white">
                  {Object.values(batteryStats).filter((s: any) => s.status === 'warning').length}
                </div>
                <div className="text-sm text-yellow-300 mt-1">Needs attention</div>
              </div>
              <div className="bg-gradient-to-br from-slate-800 to-red-900 p-6 rounded-2xl shadow-2xl border-2 border-red-500/30">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-red-400 text-lg">
                  <AlertCircle size={24} />
                  Critical
                </h3>
                <div className="text-4xl font-bold text-white">
                  {Object.values(batteryStats).filter((s: any) => s.status === 'critical').length}
                </div>
                <div className="text-sm text-red-300 mt-1">Immediate action</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl shadow-2xl border-2 border-cyan-500/30">
              <div className="p-6 border-b border-cyan-500/30 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Battery Records</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={refreshBatteryData}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                  <button
                    onClick={clearAllBatteryRecords}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    <AlertCircle size={16} />
                    Clear All Records
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Battery ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Voltage</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Current</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Temp</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/20">
                    {batteryData && batteryData.length > 0 ? batteryData.slice().reverse().map(battery => {
                      const status = getBatteryStatus(battery);
                      return (
                        <tr key={battery.id} className={
                          status === 'critical' ? 'bg-red-900/30 border-l-4 border-red-500' : 
                          status === 'warning' ? 'bg-yellow-900/30 border-l-4 border-yellow-500' : 'hover:bg-slate-800/50'
                        }>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300 font-medium">
                            {formatDateTime(battery.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                            {battery.batteryId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                            <span className={getBatteryStatusColor(battery)}>
                              {battery.voltage}V
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300 font-semibold">
                            {battery.current}A
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300 font-semibold">
                            {battery.temperature}°C
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 text-xs rounded-full font-bold ${
                                battery.status === 'charging' ? 'bg-green-500 text-white' :
                                battery.status === 'discharging' ? 'bg-red-500 text-white' :
                                'bg-gray-500 text-white'
                              }`}>
                                {battery.status}
                              </span>
                              <select
                                onChange={(e) => handleUpdateBatteryStatus(battery.batteryId, e.target.value, battery.notes || '')}
                                value={battery.status}
                                className="text-xs bg-slate-800 border border-cyan-600 rounded px-2 py-1 text-white"
                              >
                                <option value="idle">Idle</option>
                                <option value="charging">Charging</option>
                                <option value="discharging">Discharging</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs rounded-full font-bold ${
                              battery.grade === 'A' ? 'bg-green-500 text-white' :
                              battery.grade === 'B' ? 'bg-yellow-500 text-white' :
                              'bg-red-500 text-white'
                            }`}>
                              Grade {battery.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs rounded-full font-bold ${
                              battery.rank === 'Competition' ? 'bg-purple-500 text-white' :
                              battery.rank === 'Practice' ? 'bg-blue-500 text-white' :
                              battery.rank === 'Driver station' ? 'bg-orange-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {battery.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300 font-medium">
                            {battery.location || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-cyan-300 max-w-xs truncate">
                            {battery.notes || '-'}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-cyan-400">
                          <Battery size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="font-semibold text-lg">No battery records yet</p>
                          <p className="text-sm text-cyan-500">Add your first record above!</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stream' && isSetupComplete && (
          <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl shadow-2xl border-2 border-cyan-500/30">
            <div className="p-6 border-b border-cyan-500/30">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Live Competition Stream</h2>
              <p className="text-cyan-300 text-sm mt-1 font-semibold">
                Event: {eventKey} | Team: {teamNumber}
              </p>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-black rounded-xl relative overflow-hidden shadow-2xl">
                {streamUrl ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={streamUrl.url}
                    title="Live Competition Stream"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0"
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white bg-gradient-to-br from-slate-900 to-blue-900">
                    <div className="text-center">
                      <Wifi size={64} className="mx-auto mb-4 text-cyan-400 opacity-50" />
                      <p className="text-xl mb-2 font-bold text-cyan-400">Live Competition Stream</p>
                      <p className="text-sm text-cyan-500 mb-4">
                        Stream will appear here during competition
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-xl border border-cyan-500/30">
                  <h3 className="font-bold mb-2 text-cyan-400">Stream Information</h3>
                  <div className="space-y-1 text-sm text-cyan-300 font-medium">
                    <p>Event: <span className="text-white">{eventKey}</span></p>
                    <p>Team Focus: <span className="text-white">{teamNumber}</span></p>
                    <p>Status: <span className="text-white">{isLive ? 'Live Updates Active' : 'Offline Mode'}</span></p>
                    {streamUrl && (
                      <p>Source: <span className="text-white">{streamUrl.type === 'youtube' ? 'YouTube' : streamUrl.type === 'twitch' ? 'Twitch' : 'Direct'}</span></p>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-900/50 rounded-xl border border-cyan-500/30">
                  <h3 className="font-bold mb-2 text-cyan-400">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('matches')}
                      className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-bold transition-all transform hover:scale-105"
                    >
                      View Live Matches
                    </button>
                    <button
                      onClick={() => setActiveTab('rankings')}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all transform hover:scale-105"
                    >
                      Check Rankings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}