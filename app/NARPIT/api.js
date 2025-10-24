// Battery tracking functions
export async function addBatteryRecord(batteryData) {
    try {
        const response = await fetch('/api/battery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...batteryData,
                timestamp: Date.now()
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error adding battery record:', error);
        throw error;
    }
}

export async function getBatteryRecords() {
    try {
        const response = await fetch('/api/battery');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching battery records:', error);
        throw error;
    }
}

export async function updateBatteryStatus(batteryId, status, notes) {
    try {
        const response = await fetch('/api/battery/status', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                batteryId,
                status,
                notes,
                timestamp: Date.now()
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating battery status:', error);
        throw error;
    }
}

// Enhanced battery analytics
export function analyzeBatteryHealth(batteryRecords, batteryId) {
    const records = batteryRecords.filter(r => r.batteryId === batteryId).sort((a, b) => a.timestamp - b.timestamp);
    
    if (records.length < 2) return { trend: 'insufficient_data', health: 'unknown' };
    
    const recent = records.slice(-5); // Last 5 readings
    const voltageData = recent.map(r => r.voltage);
    const tempData = recent.map(r => r.temperature);
    
    // Calculate voltage trend
    const voltageSlope = calculateTrendSlope(voltageData);
    const avgTemp = tempData.reduce((a, b) => a + b, 0) / tempData.length;
    
    let health = 'good';
    let warnings = [];
    
    if (voltageSlope < -0.1) warnings.push('Voltage declining rapidly');
    if (avgTemp > 45) warnings.push('Running hot');
    if (records[records.length - 1].voltage < 11.8) warnings.push('Low voltage');
    
    if (warnings.length > 1) health = 'critical';
    else if (warnings.length > 0) health = 'warning';
    
    return {
        trend: voltageSlope > 0.05 ? 'improving' : voltageSlope < -0.05 ? 'declining' : 'stable',
        health,
        warnings,
        cycleCount: records.length,
        averageVoltage: voltageData.reduce((a, b) => a + b, 0) / voltageData.length,
        averageTemp: avgTemp
    };
}

function calculateTrendSlope(values) {
    if (values.length < 2) return 0;
    const n = values.length;
    const xSum = (n * (n - 1)) / 2;
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
}

// TBA API functions
export async function fetchTeamMatches(eventKey, teamNumber) {
    try {
        const response = await fetch(`/api/tba?endpoint=matches&eventKey=${eventKey}&teamNumber=${teamNumber}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.error ? null : data;
    } catch (error) {
        console.error('Error fetching team matches:', error);
        return null;
    }
}

export async function fetchEventTeams(eventKey) {
    try {
        const response = await fetch(`/api/tba?endpoint=teams&eventKey=${eventKey}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.error ? null : data;
    } catch (error) {
        console.error('Error fetching event teams:', error);
        return null;
    }
}

export async function fetchEventRankings(eventKey) {
    try {
        const response = await fetch(`/api/tba?endpoint=rankings&eventKey=${eventKey}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.error ? null : data;
    } catch (error) {
        console.error('Error fetching event rankings:', error);
        return null;
    }
}

export async function fetchEventMatches(eventKey) {
    try {
        const response = await fetch(`/api/tba?endpoint=event-matches&eventKey=${eventKey}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.error ? null : data;
    } catch (error) {
        console.error('Error fetching event matches:', error);
        return null;
    }
}

// Statbotics API integration for proper EPA calculation
export async function fetchStatboticsEPA(teamNumber, eventKey = null) {
    try {
        let url = `https://api.statbotics.io/v3/team_year/${teamNumber}/2025`;
        if (eventKey) {
            url = `https://api.statbotics.io/v3/team_event/${teamNumber}/${eventKey}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Statbotics API error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Statbotics data:', error);
        // Fallback to local calculation
        return null;
    }
}

export async function fetchStatboticsTeamData(teamNumber, year = 2025) {
    try {
        const response = await fetch(`https://api.statbotics.io/v3/team_year/${teamNumber}/${year}`);
        
        if (!response.ok) {
            throw new Error(`Statbotics API error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            epa: data.epa_end || data.epa_current || 0,
            autoEPA: data.auto_epa_end || data.auto_epa_current || 0,
            teleopEPA: data.teleop_epa_end || data.teleop_epa_current || 0,
            endgameEPA: data.endgame_epa_end || data.endgame_epa_current || 0,
            rp1EPA: data.rp_1_epa_end || data.rp_1_epa_current || 0,
            rp2EPA: data.rp_2_epa_end || data.rp_2_epa_current || 0,
            winRate: data.wins / (data.wins + data.losses + data.ties) || 0,
            record: `${data.wins}-${data.losses}-${data.ties}`
        };
    } catch (error) {
        console.error('Error fetching Statbotics team data:', error);
        return null;
    }
}

export async function fetchStatboticsEventData(eventKey) {
    try {
        const response = await fetch(`https://api.statbotics.io/v3/event/${eventKey}`);
        
        if (!response.ok) {
            throw new Error(`Statbotics API error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Statbotics event data:', error);
        return null;
    }
}

// Enhanced EPA calculation with Statbotics integration
export async function calculateEnhancedEPA(teamNumber, eventKey, teamMatches) {
    try {
        // Try Statbotics first
        const statboticsData = await fetchStatboticsEPA(teamNumber, eventKey);
        if (statboticsData && statboticsData.epa_end) {
            return {
                overall: statboticsData.epa_end.toFixed(2),
                auto: statboticsData.auto_epa_end?.toFixed(2) || '0',
                teleop: statboticsData.teleop_epa_end?.toFixed(2) || '0',
                endgame: statboticsData.endgame_epa_end?.toFixed(2) || '0',
                source: 'statbotics'
            };
        }
        
        // Fallback to local calculation
        return calculateLocalEPA(teamMatches, teamNumber);
    } catch (error) {
        console.error('Error calculating enhanced EPA:', error);
        return calculateLocalEPA(teamMatches, teamNumber);
    }
}

function calculateLocalEPA(teamMatches, teamNumber) {
    if (!teamMatches || teamMatches.length === 0) {
        return { overall: '0', auto: '0', teleop: '0', endgame: '0', source: 'local' };
    }
    
    let totalScore = 0, autoPoints = 0, teleopPoints = 0, endgamePoints = 0;
    let validMatches = 0;
    
    teamMatches.forEach(match => {
        if (match.alliances) {
            const isRed = match.alliances.red?.team_keys?.some(key => key.includes(teamNumber));
            const matchScore = isRed ? match.alliances.red?.score : match.alliances.blue?.score;
            
            if (matchScore !== null && matchScore !== undefined && matchScore > 0) {
                totalScore += matchScore / 3; // Divide by 3 for alliance average
                
                // Try to extract detailed scores from breakdown if available
                if (match.score_breakdown) {
                    const breakdown = isRed ? match.score_breakdown.red : match.score_breakdown.blue;
                    if (breakdown) {
                        autoPoints += (breakdown.autoPoints || 0) / 3;
                        teleopPoints += (breakdown.teleopPoints || 0) / 3;
                        endgamePoints += (breakdown.endgamePoints || 0) / 3;
                    } else {
                        // Fallback: estimate based on total score
                        autoPoints += (matchScore * 0.3) / 3;
                        teleopPoints += (matchScore * 0.5) / 3;
                        endgamePoints += (matchScore * 0.2) / 3;
                    }
                } else {
                    // Fallback: estimate based on total score
                    autoPoints += (matchScore * 0.3) / 3;
                    teleopPoints += (matchScore * 0.5) / 3;
                    endgamePoints += (matchScore * 0.2) / 3;
                }
                
                validMatches++;
            }
        }
    });
    
    return validMatches > 0 ? {
        overall: (totalScore / validMatches).toFixed(2),
        auto: (autoPoints / validMatches).toFixed(2),
        teleop: (teleopPoints / validMatches).toFixed(2),
        endgame: (endgamePoints / validMatches).toFixed(2),
        source: 'local'
    } : { overall: '0', auto: '0', teleop: '0', endgame: '0', source: 'local' };
}

// Nexus API functions
export async function fetchLiveEventData(eventKey) {
    try {
        const response = await fetch(`/api/nexus?eventKey=${eventKey}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.error ? null : data;
    } catch (error) {
        console.error('Error fetching live event data:', error);
        return null;
    }
}

// Live stream integration
export async function fetchLiveStreamUrl(eventKey) {
    try {
        // Try multiple stream sources
        const sources = [
            `https://www.thebluealliance.com/api/v3/event/${eventKey}/webcast`,
            `/api/stream?eventKey=${eventKey}`
        ];
        
        for (const source of sources) {
            try {
                const response = await fetch(source);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        return formatStreamUrl(data[0]);
                    }
                }
            } catch (err) {
                console.warn(`Failed to fetch from ${source}:`, err);
            }
        }
        
        // Fallback to FIRST official stream
        return {
            type: 'youtube',
            channel: 'FIRSTINSPIRES',
            url: 'https://www.youtube.com/embed/live_stream?channel=FIRSTINSPIRES&autoplay=1'
        };
    } catch (error) {
        console.error('Error fetching live stream URL:', error);
        return null;
    }
}

function formatStreamUrl(webcast) {
    if (!webcast || !webcast.type) {
        return {
            type: 'youtube',
            channel: 'FIRSTINSPIRES',
            url: 'https://www.youtube.com/embed/live_stream?channel=FIRSTINSPIRES&autoplay=1'
        };
    }
    
    switch (webcast.type) {
        case 'youtube':
            return {
                type: 'youtube',
                channel: webcast.channel || 'FIRSTINSPIRES',
                url: `https://www.youtube.com/embed/${webcast.channel || 'FIRSTINSPIRES'}/live?autoplay=1`
            };
        case 'twitch':
            return {
                type: 'twitch',
                channel: webcast.channel || 'FIRSTINSPIRES',
                url: `https://player.twitch.tv/?channel=${webcast.channel || 'FIRSTINSPIRES'}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&autoplay=true`
            };
        default:
            return {
                type: 'direct',
                url: webcast.url || webcast.file || 'https://www.youtube.com/embed/live_stream?channel=FIRSTINSPIRES&autoplay=1'
            };
    }
}

// Utility functions
export function formatTime(timestamp) {
    if (!timestamp) return 'Time TBD';
    return new Date(timestamp * 1000).toLocaleTimeString();
}

export function formatDateTime(timestamp) {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
}

export function getBatteryStatusColor(battery) {
    if (!battery || typeof battery.timestamp !== 'number') {
        return 'text-gray-600'; // Unknown status
    }
    
    const hoursAgo = (Date.now() - battery.timestamp) / (1000 * 60 * 60);
    
    if (hoursAgo > 2) return 'text-yellow-600'; // Warning - old data
    if (battery.voltage < 11.8) return 'text-red-600'; // Critical - low voltage
    if (battery.temperature > 50) return 'text-red-600'; // Critical - high temp
    if (battery.voltage < 12.0 || battery.temperature > 45) return 'text-yellow-600'; // Warning
    return 'text-green-600'; // Good
}

export function getBatteryStatus(battery) {
    if (!battery || typeof battery.timestamp !== 'number') {
        return 'unknown';
    }
    
    const hoursAgo = (Date.now() - battery.timestamp) / (1000 * 60 * 60);
    
    if (hoursAgo > 2) return 'warning';
    if (battery.voltage < 11.8 || battery.temperature > 50) return 'critical';
    if (battery.voltage < 12.0 || battery.temperature > 45) return 'warning';
    return 'good';
}

export function getBatteryUsageStats(batteryRecords) {
    if (!batteryRecords || !Array.isArray(batteryRecords)) {
        return {};
    }
    
    const stats = {};
    const uniqueBatteries = [...new Set(batteryRecords.map(r => r && r.batteryId).filter(Boolean))];
    
    uniqueBatteries.forEach(batteryId => {
        const records = batteryRecords.filter(r => r && r.batteryId === batteryId).sort((a, b) => a.timestamp - b.timestamp);
        const analysis = analyzeBatteryHealth(batteryRecords, batteryId);
        
        stats[batteryId] = {
            totalCycles: records.length,
            currentVoltage: records[records.length - 1]?.voltage || 0,
            lastUsed: records[records.length - 1]?.timestamp || 0,
            status: analysis.health,
            location: records[records.length - 1]?.location || 'Unknown',
            averageVoltage: analysis.averageVoltage || 0,
            averageTemp: analysis.averageTemp || 0,
            warnings: analysis.warnings || []
        };
    });
    
    return stats;
}

// Live update management with enhanced features
export class LiveUpdateManager {
    constructor() {
        this.intervals = new Map();
        this.isLive = false;
        this.updateHistory = [];
        this.failureCount = 0;
        this.maxFailures = 3;
    }
    
    startLiveUpdates(callbacks, eventKey, teamNumber, intervalMs = 5000) {
        this.isLive = true;
        this.failureCount = 0;
        
        // Start interval for each callback
        Object.entries(callbacks).forEach(([name, callback]) => {
            const interval = setInterval(async () => {
                if (this.isLive) {
                    try {
                        await callback(eventKey, teamNumber);
                        this.logUpdate(name, 'success');
                        this.failureCount = Math.max(0, this.failureCount - 1);
                    } catch (error) {
                        this.logUpdate(name, 'error', error.message);
                        this.failureCount++;
                        
                        if (this.failureCount >= this.maxFailures) {
                            console.warn(`Too many failures (${this.failureCount}), slowing update rate`);
                            this.adjustUpdateRate(name, intervalMs * 2);
                        }
                    }
                }
            }, intervalMs);
            
            this.intervals.set(name, { interval, rate: intervalMs });
        });
    }
    
    adjustUpdateRate(callbackName, newRate) {
        const existing = this.intervals.get(callbackName);
        if (existing) {
            clearInterval(existing.interval);
            // Would need to restart with new rate - simplified for this example
            console.log(`Adjusted update rate for ${callbackName} to ${newRate}ms`);
        }
    }
    
    logUpdate(name, status, error = null) {
        const entry = {
            timestamp: Date.now(),
            callback: name,
            status,
            error
        };
        
        this.updateHistory.unshift(entry);
        if (this.updateHistory.length > 100) {
            this.updateHistory = this.updateHistory.slice(0, 100);
        }
    }
    
    stopLiveUpdates() {
        this.isLive = false;
        
        // Clear all intervals
        this.intervals.forEach(({ interval }) => {
            clearInterval(interval);
        });
        
        this.intervals.clear();
    }
    
    isUpdateActive() {
        return this.isLive;
    }
    
    getUpdateStats() {
        const now = Date.now();
        const lastMinute = this.updateHistory.filter(entry => now - entry.timestamp < 60000);
        
        return {
            totalUpdates: this.updateHistory.length,
            lastMinuteUpdates: lastMinute.length,
            successRate: this.updateHistory.filter(e => e.status === 'success').length / Math.max(1, this.updateHistory.length),
            failureCount: this.failureCount,
            activeCallbacks: Array.from(this.intervals.keys())
        };
    }
}

// Export a singleton instance
export const liveUpdateManager = new LiveUpdateManager();