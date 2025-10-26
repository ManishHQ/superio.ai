'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
	const router = useRouter();
	const [displayText, setDisplayText] = useState('');
	const fullText = 'Your onchain superintelligence';
	const typingSpeed = 80; // milliseconds per character

	useEffect(() => {
		let currentIndex = 0;
		const interval = setInterval(() => {
			if (currentIndex <= fullText.length) {
				setDisplayText(fullText.slice(0, currentIndex));
				currentIndex++;
			} else {
				clearInterval(interval);
			}
		}, typingSpeed);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className='font-sans min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-primary/5'>
			{/* Theme Toggle */}
			<div className='absolute top-6 right-6 z-50'>
				<ThemeToggle />
			</div>

			{/* Hero Section */}
			<div className='flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8'>
				<div className='max-w-5xl w-full text-center space-y-8'>
					{/* Logo/Icon */}
					<div className='flex justify-center mb-8'>
						<div className='relative'>
							<div className='w-24 h-24 border-4 border-primary rounded-full flex items-center justify-center bg-background shadow-2xl shadow-primary/20'>
								<svg
									className='w-12 h-12 text-primary'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M13 10V3L4 14h7v7l9-11h-7z'
									/>
								</svg>
							</div>
							{/* Animated ring */}
							<div className='absolute inset-0 rounded-full border-2 border-primary/30 animate-ping' />
						</div>
					</div>

					{/* Title */}
					<h1 className='text-6xl sm:text-7xl md:text-8xl font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent animate-gradient'>
						Superio
					</h1>

					{/* Subtitle with Typewriter Effect */}
					<div className='h-16 flex items-center justify-center'>
						<p className='text-2xl sm:text-3xl md:text-4xl text-muted-foreground font-light'>
							{displayText}
							<span className='inline-block w-1 h-8 ml-1 bg-primary animate-pulse' />
						</p>
					</div>

					{/* Description */}
					<p className='text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mt-8'>
						Advanced AI-powered blockchain analytics, DeFi insights, and intelligent transaction preparation
					</p>

					{/* CTA Buttons */}
					<div className='flex flex-col sm:flex-row gap-4 justify-center items-center mt-12'>
						<button
							onClick={() => router.push('/chat')}
							className='group relative px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105'
						>
							<span className='relative z-10'>Start Chat with AI</span>
							<div className='absolute inset-0 rounded-lg bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
						</button>

						<button
							onClick={() => {
								const featuresSection = document.getElementById('features');
								featuresSection?.scrollIntoView({ behavior: 'smooth' });
							}}
							className='px-8 py-4 border-2 border-primary text-primary rounded-lg font-semibold text-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300'
						>
							Learn More
						</button>
					</div>

					{/* Features Section */}
					<div id='features' className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 pt-12'>
						<div className='p-6 rounded-lg border border-primary/20 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10'>
							<div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4'>
								<svg className='w-6 h-6 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
								</svg>
							</div>
							<h3 className='text-xl font-semibold mb-2 text-foreground'>On-chain Analytics</h3>
							<p className='text-muted-foreground'>
								Comprehensive blockchain analysis with transaction lookup, address analytics, and reputation scoring
							</p>
						</div>

						<div className='p-6 rounded-lg border border-primary/20 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10'>
							<div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4'>
								<svg className='w-6 h-6 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
								</svg>
							</div>
							<h3 className='text-xl font-semibold mb-2 text-foreground'>DeFi Intelligence</h3>
							<p className='text-muted-foreground'>
								AI-powered yield farming recommendations, market insights, and DeFi protocol analysis
							</p>
						</div>

						<div className='p-6 rounded-lg border border-primary/20 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10'>
							<div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4'>
								<svg className='w-6 h-6 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' />
								</svg>
							</div>
							<h3 className='text-xl font-semibold mb-2 text-foreground'>Smart Transactions</h3>
							<p className='text-muted-foreground'>
								Prepare token swaps and transfers with intelligent routing and gas optimization
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
