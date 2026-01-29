import React, { useState, useEffect } from 'react';

interface TimerProps {
    startTime: number;
    pauseTimeTotal?: number;
    isPaused?: boolean;
}

const Timer: React.FC<TimerProps> = ({ startTime, pauseTimeTotal = 0, isPaused }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const update = () => {
            const now = Date.now();
            const totalMs = now - startTime - pauseTimeTotal;
            setElapsed(Math.max(0, Math.floor(totalMs / 1000)));
        };

        update();
        if (isPaused) return;

        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime, pauseTimeTotal, isPaused]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return <span className="time">{formatTime(elapsed)}</span>;
};

export default Timer;
