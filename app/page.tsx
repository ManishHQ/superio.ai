'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Image from 'next/image';

export default function Home() {
	const router = useRouter();
	const { isConnected } = useAccount();
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
		<div className='min-h-screen w-full flex flex-col items-center justify-center bg-background px-4'>
			{/* Logo */}
			<div className='mb-8 animate-pulse'>
				<Image
					src='/superio-logo-transparent.png'
					alt='Superio Logo'
					width={200}
					height={200}
					priority
					className='drop-shadow-[0_0_30px_rgba(0,255,65,0.5)]'
				/>
			</div>

			{/* Title */}
			<h1 className='text-7xl sm:text-8xl md:text-9xl font-black text-primary mb-8 tracking-wider' style={{ fontFamily: 'var(--font-orbitron)' }}>
				Superio
			</h1>

			{/* Subtitle with Typewriter Effect */}
			<div className='h-20 flex items-center justify-center mb-12'>
				<p className='text-3xl sm:text-4xl md:text-5xl text-muted-foreground font-medium tracking-wide' style={{ fontFamily: 'var(--font-orbitron)' }}>
					{displayText}
					<span className='inline-block w-1 h-10 ml-1 bg-primary animate-pulse' />
				</p>
			</div>

			{/* Connect Wallet Button */}
			<div className='flex flex-col items-center gap-6'>
				<div className='scale-125'>
					<ConnectButton />
				</div>

				{/* Start Chatting Button - Show when wallet is connected */}
				{isConnected && (
					<button
						onClick={() => router.push('/chat')}
						className='px-8 py-4 text-lg font-bold tracking-wide'
						style={{ fontFamily: 'var(--font-orbitron)' }}
					>
						Start Chatting →
					</button>
				)}
			</div>
		</div>
	);
}
