import React, { useMemo } from 'react';
import { useLanes } from '../context/LaneContext';
import './CenterInsights.css';

const CenterInsights: React.FC = () => {
    const { lanes, sessions, logs } = useLanes();

    const metrics = useMemo(() => {
        const activeLanes = lanes.filter(l => l.status === 'active').length;
        const totalLanes = lanes.length;
        const occupancy = totalLanes > 0 ? (activeLanes / totalLanes) * 100 : 0;

        // Avg session duration (finished sessions)
        const finishedSessions = sessions.filter(s => !s.isActive && s.endTime);
        const avgDuration = finishedSessions.length > 0
            ? finishedSessions.reduce((acc, s) => acc + (s.endTime! - s.startTime), 0) / finishedSessions.length
            : 0;

        return {
            occupancy: Math.round(occupancy),
            avgDuration: Math.round(avgDuration / 60000), // convert to minutes
        };
    }, [lanes, sessions, logs]);

    return (
        <div className="insights-container">
            <div className="insight-card">
                <span className="insight-label">Ocupação Atual</span>
                <div className="insight-value-group">
                    <span className="insight-value">{metrics.occupancy}%</span>
                    <div className="insight-progress">
                        <div className="insight-bar" style={{ width: `${metrics.occupancy}%` }} />
                    </div>
                </div>
            </div>

            <div className="insight-card">
                <span className="insight-label">Média de Jogo</span>
                <div className="insight-value-group">
                    <span className="insight-value">{metrics.avgDuration} <small>min</small></span>
                </div>
            </div>
        </div>
    );
};

export default CenterInsights;
