'use client';

import { useAccount, useEnsName, useBalance } from 'wagmi';
import { WalletConnection } from './wallet-connection';
import { Button } from './ui/button';
import Link from 'next/link';

export function WalletInfo() {
	const { address, isConnected, chain } = useAccount();
	const { data: ensName } = useEnsName({ address });
	const { data: balance } = useBalance({ address });

	if (!isConnected) {
		return (
			<div className='flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-8 bg-card border-2 border-border rounded-lg shadow-lg w-full'>
				<div className='w-12 h-12 sm:w-16 sm:h-16 border-2 border-primary rounded-full flex items-center justify-center'>
					<svg
						className='w-6 h-6 sm:w-8 sm:h-8 text-primary'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
						/>
					</svg>
				</div>
				<div className='text-center'>
					<h2 className='text-xl sm:text-2xl font-bold text-foreground mb-2'>
						Connect Your Wallet
					</h2>
					<p className='text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2'>
						Connect your wallet to access the decentralized web
					</p>
				</div>
				<WalletConnection />
			</div>
		);
	}

	return (
		<div className='bg-card border-2 border-border rounded-lg shadow-xl p-4 sm:p-6 w-full'>
			<div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6'>
				<div className='flex items-center gap-3'>
					<div className='w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary rounded-full flex items-center justify-center'>
						<svg
							className='w-4 h-4 sm:w-5 sm:h-5 text-primary'
							fill='currentColor'
							viewBox='0 0 20 20'
						>
							<path
								fillRule='evenodd'
								d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
								clipRule='evenodd'
							/>
						</svg>
					</div>
					<div>
						<h2 className='text-lg sm:text-xl font-bold text-foreground'>
							Wallet Connected
						</h2>
						<p className='text-xs sm:text-sm text-muted-foreground'>
							Successfully connected
						</p>
					</div>
				</div>
				<div className='flex-shrink-0'>
					<WalletConnection />
				</div>
			</div>

			<div className='space-y-4'>
				<div className='bg-secondary rounded-lg p-3 sm:p-4 border border-border'>
					<label className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block'>
						Wallet Address
					</label>
					<p className='font-mono text-xs sm:text-sm text-foreground break-all bg-background p-2 rounded border border-border overflow-hidden'>
						{address}
					</p>
				</div>

				{ensName && (
					<div className='bg-secondary rounded-lg p-3 sm:p-4 border border-border'>
						<label className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block'>
							ENS Name
						</label>
						<p className='text-base sm:text-lg font-semibold text-accent break-all'>
							{ensName}
						</p>
					</div>
				)}

				<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
					{balance && (
						<div className='bg-secondary rounded-lg p-3 sm:p-4 border-2 border-primary'>
							<label className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block'>
								Balance
							</label>
							<p className='text-base sm:text-lg font-bold text-foreground'>
								{parseFloat(balance.formatted).toFixed(4)}
							</p>
							<p className='text-xs text-primary font-medium'>
								{balance.symbol}
							</p>
						</div>
					)}

					{chain && (
						<div className='bg-secondary rounded-lg p-3 sm:p-4 border-2 border-destructive'>
							<label className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block'>
								Network
							</label>
							<p className='text-base sm:text-lg font-bold text-foreground break-words'>
								{chain.name}
							</p>
							<div className='flex items-center gap-1 mt-1'>
								<div className='w-2 h-2 bg-primary rounded-full'></div>
								<span className='text-xs text-muted-foreground'>
									Connected
								</span>
							</div>
						</div>
					)}
				</div>

				<div className='pt-4 border-t-2 border-border mt-6'>
					<Link href='/chat'>
						<Button className='w-full justify-center gap-2'>
							<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
							</svg>
							<span>Start Chat with AI</span>
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
