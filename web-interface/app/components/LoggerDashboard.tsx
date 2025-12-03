"use client";

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

// Define the shape of a reading
interface Reading {
    time: string;
    before: number;
    after: number;
    reduction: number;
}

export default function LoggerDashboard() {
    const [readings, setReadings] = useState<Reading[]>([]);

    useEffect(() => {
        const evtSource = new EventSource('/api/readings');
        evtSource.onmessage = (e) => {
            try {
                const payload = JSON.parse(e.data) as { before: number; after: number; reduction: number };
                const newReading: Reading = {
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    before: payload.before,
                    after: payload.after,
                    reduction: payload.reduction,
                };
                setReadings((prev) => {
                    const updated = [...prev, newReading];
                    // Keep only the latest 30 points to avoid memory bloat
                    return updated.length > 30 ? updated.slice(updated.length - 30) : updated;
                });
            } catch (err) {
                console.error('Failed to parse sensor data', err);
            }
        };
        evtSource.onerror = (err) => {
            console.error('EventSource failed', err);
            evtSource.close();
        };
        return () => {
            evtSource.close();
        };
    }, []);

    // Use the most recent reading for the summary boxes
    const latest = readings[readings.length - 1] || { before: 0, after: 0, reduction: 0 };

    return (
        <section className="w-full max-w-4xl mx-auto p-6 bg-white/30 dark:bg-black/30 backdrop-blur-lg rounded-xl shadow-lg border border-white/20">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
                Enviromotive MQ7 Sensor Dashboard
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current Before (ppm)</span>
                    <span className="text-3xl font-bold text-indigo-600">{latest.before.toFixed(1)}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current After (ppm)</span>
                    <span className="text-3xl font-bold text-green-600">{latest.after.toFixed(1)}</span>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={readings} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="time" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip />
                    <Line type="monotone" dataKey="before" stroke="#6366F1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="after" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </section>
    );
}
