import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

type PortfolioMockPreviewProps = {
  themeId: string;
};

export default function PortfolioMockPreview({ themeId }: PortfolioMockPreviewProps) {
  // Example theme backgrounds (should match your theme palette)
  const themeStyles: { [key: string]: string } = {
    modern: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    dark: 'bg-gradient-to-br from-gray-800 to-gray-900',
    gradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
    minimal: 'bg-gradient-to-br from-gray-400 to-gray-600',
    ocean: 'bg-gradient-to-br from-blue-600 to-teal-600',
    sunset: 'bg-gradient-to-br from-orange-500 to-red-500',
    forest: 'bg-gradient-to-br from-green-600 to-emerald-600',
    midnight: 'bg-gradient-to-br from-indigo-800 to-purple-900',
    coral: 'bg-gradient-to-br from-pink-400 to-rose-500',
    steel: 'bg-gradient-to-br from-slate-600 to-gray-700',
    aurora: 'bg-gradient-to-br from-emerald-400 to-cyan-500',
    fire: 'bg-gradient-to-br from-red-600 to-orange-600',
    lavender: 'bg-gradient-to-br from-purple-400 to-violet-500',
    sapphire: 'bg-gradient-to-br from-blue-700 to-indigo-700',
    amber: 'bg-gradient-to-br from-amber-500 to-yellow-500',
  };

  return (
    <div className={`w-full h-full rounded-lg flex flex-col items-center justify-center p-8 ${themeStyles[themeId] || themeStyles['modern']}`}>
      <div className="bg-white bg-opacity-80 rounded-lg p-6 shadow-lg w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">John Doe</h2>
        <p className="text-gray-700 mb-4">Full Stack Developer | React, Node.js, MongoDB</p>
        <div className="flex gap-4 mb-4">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">Projects</span>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">Experience</span>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">Certifications</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded p-3">
            <h3 className="font-semibold text-gray-800">Portfolio Project</h3>
            <p className="text-xs text-gray-600">A modern web app built with Next.js</p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <h3 className="font-semibold text-gray-800">Company XYZ</h3>
            <p className="text-xs text-gray-600">Software Engineer (2022-2025)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
